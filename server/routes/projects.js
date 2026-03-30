const express = require('express');
const Project = require('../models/Project');
const Expert = require('../models/Expert');
const aiMatchingService = require('../services/aiMatchingService');

const router = express.Router();

/**
 * POST /api/projects/:id/match-experts
 * Body optionnel : { topN?: number }
 */
router.post('/:id/match-experts', async (req, res) => {
  try {
    const projectId = req.params.id;
    const topN = Math.min(
      500,
      Math.max(1, parseInt(String(req.body?.topN ?? 10), 10) || 10),
    );

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    const experts = await Expert.find({ isActive: true }).exec();

    const { matches, project_summary, source, error } =
      await aiMatchingService.matchProjectExperts(project, experts, topN);

    const savedEntries = matches.map((m) => {
      return {
        expertId: String(m.expert_id),
        score: m.score,
        breakdown: {
          skills: m.breakdown?.skills ?? m.breakdown?.skills_match ?? 0,
          reputation: m.breakdown?.reputation ?? 0,
          location: m.breakdown?.location ?? 0,
          experience: m.breakdown?.experience ?? 0,
          availability: m.breakdown?.availability ?? 0,
        },
        explanation: m.explanation || '',
        computedAt: new Date(),
      };
    });

    project.expertMatches = savedEntries;
    project.lastExpertMatchAt = new Date();
    await project.save();

    return res.status(200).json({
      projectId: project._id,
      matches,
      project_summary,
      source,
      ...(source === 'fallback' && error ? { warning: 'Service IA indisponible', detail: error } : {}),
    });
  } catch (e) {
    console.error('[match-experts]', e);
    return res.status(500).json({
      message: 'Erreur lors du matching des experts.',
      error: process.env.NODE_ENV === 'development' ? String(e.message) : undefined,
    });
  }
});

module.exports = router;
