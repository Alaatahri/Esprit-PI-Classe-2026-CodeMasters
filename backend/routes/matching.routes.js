const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const Project = require('../models/Project');
const User = require('../models/User');

/** Compat front (anciennement Worker.name / .workerType) */
function enrichMatchUser(u) {
  if (!u) return null;
  return {
    ...u,
    name: u.nom,
    workerType: u.role,
    experienceYears: u.experience_annees ?? 0,
  };
}
const { triggerAutoMatching } = require('../controllers/project.controller');
const { notifyAdmin, notifyClient } = require('../socket/matchingSocket');

const router = express.Router();

const AI_BASE = () =>
  (process.env.AI_SERVICE_URL || 'http://localhost:8001').replace(/\/$/, '');

/**
 * PATCH /api/matching/:projectId/respond
 * Body: { workerId, action: "accepted" | "rejected" }
 */
router.patch('/:projectId/respond', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { workerId, action } = req.body || {};
    const io = req.app.get('io');

    if (!workerId || !['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'workerId et action (accepted|rejected) requis.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    const match = project.aiMatches.find(
      (m) => m.workerId && m.workerId.toString() === String(workerId),
    );
    if (!match) {
      return res.status(404).json({ message: 'Match introuvable.' });
    }

    match.status = action;
    match.respondedAt = new Date();

    if (action === 'accepted') {
      project.matchingStatus = 'matched';
      project.assignedWorker = new mongoose.Types.ObjectId(workerId);
      await User.findByIdAndUpdate(workerId, { $inc: { activeProjects: 1 } });

      const worker = await User.findById(workerId).lean();
      if (worker) {
        notifyAdmin(io, 'match_accepted', {
          projectId,
          projectTitle: project.titre,
          workerName: worker.nom,
        });
        if (project.clientId) {
          notifyClient(io, project.clientId.toString(), 'project_assigned', {
            projectId,
            projectTitle: project.titre,
            worker: {
              name: worker.nom,
              workerType: worker.role,
              rating: worker.rating,
              phone: worker.telephone,
            },
          });
        }
      }
    }

    if (action === 'rejected') {
      const allDone = project.aiMatches.every(
        (m) => m.status === 'rejected' || m.status === 'expired',
      );
      if (allDone) {
        await triggerAutoMatching(project, io, { offset: 3 });
        notifyAdmin(io, 'all_matches_rejected_retrying', { projectId });
      }
    }

    await project.save();
    return res.json({ success: true, project });
  } catch (e) {
    console.error('[matching respond]', e);
    return res.status(500).json({ message: e.message || 'Erreur serveur' });
  }
});

/**
 * GET /api/matching/my-requests?workerId=xxx
 */
router.get('/my-requests', async (req, res) => {
  try {
    const workerId = req.query.workerId;
    if (!workerId || !mongoose.Types.ObjectId.isValid(String(workerId))) {
      return res.status(400).json({ message: 'workerId valide requis.' });
    }

    const wid = new mongoose.Types.ObjectId(String(workerId));
    const projects = await Project.find({
      aiMatches: { $elemMatch: { workerId: wid } },
    }).lean();

    const result = projects.map((p) => {
      const match = (p.aiMatches || []).find(
        (m) => m.workerId && m.workerId.toString() === String(workerId),
      );
      const timeRemaining = match?.expiresAt
        ? Math.max(0, new Date(match.expiresAt).getTime() - Date.now())
        : null;

      return {
        project: {
          _id: p._id,
          title: p.titre,
          description: p.description,
          projectCategory: p.projectCategory,
          complexity: p.complexity,
          requiredSkills: p.requiredSkills,
          budget: p.budget != null ? p.budget : p.budget_estime,
          surface: p.surface,
          location: p.location,
        },
        match: {
          score: match?.score,
          breakdown: match?.breakdown,
          explanation: match?.explanation,
          status: match?.status,
          expiresAt: match?.expiresAt,
          timeRemainingMs: timeRemaining,
        },
      };
    });

    return res.json(result);
  } catch (e) {
    console.error('[my-requests]', e);
    return res.status(500).json({ message: e.message || 'Erreur serveur' });
  }
});

/**
 * GET /api/matching/admin/projects — liste projets enrichie (admin matching)
 */
router.get('/admin/projects', async (_req, res) => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 }).lean();
    const ids = [
      ...new Set(
        projects.flatMap((p) => (p.aiMatches || []).map((m) => m.workerId).filter(Boolean)),
      ),
    ];
    const workers = ids.length
      ? await User.find({ _id: { $in: ids } }).lean()
      : [];
    const wMap = Object.fromEntries(workers.map((w) => [w._id.toString(), w]));
    const enriched = projects.map((p) => ({
      ...p,
      title: p.titre,
      status: p.matchingStatus,
      aiMatches: (p.aiMatches || []).map((m) => {
        const wid = m.workerId ? m.workerId.toString() : '';
        return {
          ...m,
          worker: enrichMatchUser(wid ? wMap[wid] || null : null),
        };
      }),
    }));
    return res.json(enriched);
  } catch (e) {
    console.error('[admin/projects]', e);
    return res.status(500).json({ message: e.message || 'Erreur serveur' });
  }
});

/**
 * POST /api/matching/run — relance matching IA
 */
router.post('/run', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { projectId, topN, offset } = req.body || {};
    if (!projectId) {
      return res.status(400).json({ message: 'projectId requis.' });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }
    const matchingMeta = await triggerAutoMatching(project, io, {
      topN: topN != null ? Number(topN) : 3,
      offset: offset != null ? Number(offset) : 0,
    });
    const fresh = await Project.findById(projectId).lean();
    const ids = [
      ...new Set(
        (fresh.aiMatches || []).map((m) => m.workerId).filter(Boolean),
      ),
    ];
    const workers = ids.length
      ? await User.find({ _id: { $in: ids } }).lean()
      : [];
    const wMap = Object.fromEntries(workers.map((w) => [w._id.toString(), w]));
    const enriched = {
      ...fresh,
      title: fresh.titre,
      status: fresh.matchingStatus,
      aiMatches: (fresh.aiMatches || []).map((m) => {
        const wid = m.workerId ? m.workerId.toString() : '';
        return { ...m, worker: enrichMatchUser(wid ? wMap[wid] || null : null) };
      }),
    };
    return res.json({ success: true, project: enriched, matchingMeta });
  } catch (e) {
    console.error('[matching run]', e);
    return res.status(500).json({ message: e.message || 'Erreur serveur' });
  }
});

/**
 * GET /api/matching/health — proxy vers le service Python
 */
router.get('/health', async (_req, res) => {
  try {
    await axios.get(`${AI_BASE()}/health`, { timeout: 5000 });
    return res.json({ aiService: 'online' });
  } catch {
    return res.json({ aiService: 'offline' });
  }
});

module.exports = router;
