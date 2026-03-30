const mongoose = require('mongoose');

const breakdownSchema = new mongoose.Schema(
  {
    skills: { type: Number },
    skills_match: { type: Number },
    reputation: { type: Number },
    location: { type: Number },
    experience: { type: Number },
    availability: { type: Number },
  },
  { _id: false },
);

const expertMatchEntrySchema = new mongoose.Schema(
  {
    expertId: { type: String, required: true },
    score: { type: Number, required: true },
    breakdown: { type: breakdownSchema, required: true },
    explanation: { type: String, default: '' },
    computedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * Projet — aligné sur la collection NestJS existante + champs matching.
 * strict: false pour ne pas supprimer les champs gérés par le backend Nest.
 */
const projectSchema = new mongoose.Schema(
  {
    titre: String,
    description: { type: String, default: '' },
    date_debut: Date,
    date_fin_prevue: Date,
    budget_estime: Number,
    statut: String,
    avancement_global: Number,
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    applications: Array,
    /** Compétences requises pour le matching (optionnel) */
    requiredSkills: { type: [String], default: [] },
    /** Localisation du projet pour le score géographique */
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    /** Derniers résultats de matching sauvegardés */
    expertMatches: { type: [expertMatchEntrySchema], default: [] },
    lastExpertMatchAt: { type: Date },
  },
  { strict: false, timestamps: true },
);

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
