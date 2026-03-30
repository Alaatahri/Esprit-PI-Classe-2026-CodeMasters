const path = require('path');
const { pathToFileURL } = require('url');

const axios = require('axios');
const mongoose = require('mongoose');

const User = require('../models/User');
const Project = require('../models/Project');

const {
  notifyWorker,
  notifyAdmin,
} = require('../socket/matchingSocket');

async function loadNearbyGouvernorats() {
  const gPath = path.join(__dirname, '../utils/gouvernorats.js');
  return import(pathToFileURL(gPath).href);
}

/**
 * @param {import('mongoose').Document} project
 * @param {import('socket.io').Server | null | undefined} io
 * @param {{ offset?: number; topN?: number }} [options]
 * @returns {Promise<{ ok: boolean; matchCount?: number; reason?: string; message?: string }>}
 */
async function triggerAutoMatching(project, io, options = {}) {
  const offset = Number(options.offset) || 0;
  const topN = Math.min(500, Math.max(1, Number(options.topN) || 3));

  try {
    const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8001').replace(/\/$/, '');
    const { nearbyGouvernorats } = await loadNearbyGouvernorats();

    const budgetValue =
      typeof project.budget === 'number' && !Number.isNaN(project.budget)
        ? project.budget
        : project.budget_estime;

    const { data: analysis } = await axios.post(`${AI_URL}/analyze-project`, {
      description: project.description || '',
      category: project.projectCategory || '',
      budget: budgetValue ?? 0,
      surface: project.surface != null ? project.surface : null,
      required_skills: project.requiredSkills || [],
    });

    project.complexity = analysis.complexity;
    project.requiredWorkerTypes = analysis.required_worker_types || analysis.requiredWorkerTypes || [];
    project.complexityReasoning = analysis.reasoning;

    const nearby = project.location?.gouvernorat
      ? nearbyGouvernorats(project.location.gouvernorat)
      : null;

    const requiredTypesRaw =
      analysis.required_worker_types || analysis.requiredWorkerTypes || [];
    const requiredTypesAll = [
      'artisan',
      'ouvrier',
      'electricien',
      'expert',
      'architecte',
    ];
    const requiredTypes = requiredTypesRaw.length
      ? requiredTypesRaw
      : requiredTypesAll;

    const baseWorkerQuery = {
      role: { $in: requiredTypes },
      isAvailable: true,
    };

    const excludeIds = (project.aiMatches || []).map((m) => m.workerId).filter(Boolean);
    if (excludeIds.length) {
      baseWorkerQuery._id = { $nin: excludeIds };
    }

    /** @type {Record<string, unknown>} */
    let workerQuery = { ...baseWorkerQuery };
    const geoApplied =
      Boolean(nearby && nearby.length) && Boolean(project.location?.gouvernorat);
    if (geoApplied) {
      workerQuery['location.gouvernorat'] = { $in: nearby };
    }

    let remaining = await User.find(workerQuery).sort({ _id: 1 }).lean();
    if (!remaining.length && geoApplied) {
      workerQuery = { ...baseWorkerQuery };
      remaining = await User.find(workerQuery).sort({ _id: 1 }).lean();
    }

    const workers = remaining.slice(offset, offset + topN);

    if (!workers.length) {
      await project.save();
      return {
        ok: false,
        reason: remaining.length ? 'offset_exhausted' : 'no_workers',
      };
    }

    const matchPayload = {
      project: {
        description: project.description || '',
        required_skills: project.requiredSkills || [],
        location: project.location?.lat != null &&
          project.location?.lng != null &&
          !Number.isNaN(project.location.lat) &&
          !Number.isNaN(project.location.lng)
          ? { lat: project.location.lat, lng: project.location.lng }
          : null,
        budget: budgetValue,
      },
      experts: workers.map((w) => ({
        expertId: w._id.toString(),
        bio: w.bio || '',
        skills: w.skills || [],
        rating: w.rating || 0,
        reviewsCount: w.reviewsCount || 0,
        activeProjects: w.activeProjects || 0,
        experienceYears: w.experience_annees ?? w.experienceYears ?? 0,
        workerType: w.role,
        location:
          w.location?.lat != null &&
          w.location?.lng != null &&
          !Number.isNaN(w.location.lat) &&
          !Number.isNaN(w.location.lng)
            ? { lat: w.location.lat, lng: w.location.lng }
            : null,
      })),
      required_worker_types: requiredTypes,
      topN,
    };

    const { data: matchResult } = await axios.post(`${AI_URL}/match`, matchPayload);

    const pickExpertId = (m) => {
      const raw = m?.expert_id ?? m?.expertId;
      if (raw == null || raw === '') return '';
      return String(raw).trim();
    };

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const workerMap = Object.fromEntries(workers.map((w) => [w._id.toString(), w]));

    const newEntries = (matchResult.matches || [])
      .map((m) => {
        const eid = pickExpertId(m);
        if (!eid || !mongoose.Types.ObjectId.isValid(eid)) return null;
        return {
          workerId: new mongoose.Types.ObjectId(eid),
          workerType: workerMap[eid]?.role,
          score: m.score,
          breakdown: m.breakdown,
          explanation: m.explanation,
          status: 'pending',
          notifiedAt: new Date(),
          expiresAt,
        };
      })
      .filter(Boolean);

    const prev = project.aiMatches ? [...project.aiMatches] : [];
    project.aiMatches = [...prev, ...newEntries];

    project.matchingStatus = 'searching';
    await project.save();

    if (io) {
      for (const match of matchResult.matches || []) {
        const eid = pickExpertId(match);
        if (!eid) continue;
        const worker = workerMap[eid];
        notifyWorker(io, eid, 'new_match_request', {
          projectId: project._id.toString(),
          projectTitle: project.titre,
          projectCategory: project.projectCategory,
          complexity: project.complexity,
          budget: budgetValue,
          location: project.location,
          score: match.score,
          breakdown: match.breakdown,
          explanation: match.explanation,
          expiresAt: expiresAt.toISOString(),
        });
        if (!worker) {
          /* noop */
        }
      }
      notifyAdmin(io, 'new_auto_match_done', {
        projectId: project._id,
        projectTitle: project.titre,
        complexity: project.complexity,
        matchCount: (matchResult.matches || []).length,
      });
    }

    return {
      ok: true,
      matchCount: (matchResult.matches || []).length,
    };
  } catch (err) {
    console.error('[triggerAutoMatching]', err.message);
    return { ok: false, reason: 'error', message: err.message };
  }
}

/**
 * Exemple de création de projet — brancher sur votre route Express.
 */
async function createProject(req, res) {
  try {
    const body = req.body || {};
    const doc = {
      titre: body.titre || body.title,
      description: body.description,
      date_debut: body.date_debut || body.dateDebut,
      date_fin_prevue: body.date_fin_prevue || body.dateFinPrevue,
      budget_estime: body.budget_estime ?? body.budget,
      budget: body.budget ?? body.budget_estime,
      statut: body.statut || 'En attente',
      avancement_global: body.avancement_global ?? 0,
      clientId: body.clientId,
      projectCategory: body.projectCategory,
      requiredSkills: body.requiredSkills || [],
      surface: body.surface,
      location: body.location,
    };

    const project = new Project(doc);
    await project.save();

    await triggerAutoMatching(project, req.app.get('io'));

    return res.status(201).json(project);
  } catch (e) {
    console.error('[createProject]', e);
    return res.status(400).json({ message: e.message || 'Erreur création projet' });
  }
}

module.exports = {
  createProject,
  triggerAutoMatching,
};
