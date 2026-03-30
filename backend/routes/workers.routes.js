const express = require('express');

const User = require('../models/User');



const router = express.Router();



const FIELD_ROLES = ['artisan', 'ouvrier', 'electricien', 'expert', 'architecte'];



/**

 * Profils terrain (même collection users que les comptes Nest).

 * GET /api/workers

 */

router.get('/', async (_req, res) => {

  try {

    const list = await User.find({ role: { $in: FIELD_ROLES } })

      .sort({ nom: 1 })

      .select(

        'nom email role specialite experience_annees rating isAvailable location.city location.gouvernorat',

      )

      .lean();

    const mapped = list.map((u) => ({

      ...u,

      name: u.nom,

      workerType: u.role,

      experienceYears: u.experience_annees ?? 0,

    }));

    return res.json(mapped);

  } catch (e) {

    return res.status(500).json({ message: e.message || 'Erreur serveur' });

  }

});



router.get('/:id', async (req, res) => {

  try {

    const w = await User.findById(req.params.id).lean();

    if (!w) return res.status(404).json({ message: 'Profil introuvable.' });

    return res.json({

      ...w,

      name: w.nom,

      workerType: w.role,

      experienceYears: w.experience_annees ?? 0,

    });

  } catch (e) {

    return res.status(500).json({ message: e.message });

  }

});



router.patch('/:id', async (req, res) => {

  try {

    const allowed = ['isAvailable', 'nom', 'telephone', 'bio', 'skills', 'dailyRate'];

    const patch = {};

    for (const k of allowed) {

      if (k in req.body) patch[k] = req.body[k];

    }

    const w = await User.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).lean();

    if (!w) return res.status(404).json({ message: 'Profil introuvable.' });

    return res.json({

      ...w,

      name: w.nom,

      workerType: w.role,

      experienceYears: w.experience_annees ?? 0,

    });

  } catch (e) {

    return res.status(500).json({ message: e.message });

  }

});



module.exports = router;


