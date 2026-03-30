const mongoose = require('mongoose');

const aiMatchBreakdownSchema = new mongoose.Schema(
  {
    skills: { type: Number },
    reputation: { type: Number },
    location: { type: Number },
    experience: { type: Number },
    availability: { type: Number },
  },
  { _id: false },
);

const aiMatchSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    workerType: { type: String },
    score: { type: Number },
    breakdown: { type: aiMatchBreakdownSchema },
    explanation: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    notifiedAt: { type: Date },
    respondedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { _id: true },
);

const projectSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    description: { type: String, required: true },
    date_debut: { type: Date, required: true },
    date_fin_prevue: { type: Date, required: true },
    budget_estime: { type: Number, required: true },
    statut: {
      type: String,
      required: true,
      enum: ['En attente', 'En cours', 'Terminé'],
      default: 'En attente',
    },
    avancement_global: { type: Number, required: true, default: 0, min: 0, max: 100 },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    applications: {
      type: [
        {
          artisanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          statut: {
            type: String,
            enum: ['en_attente', 'acceptee', 'refusee'],
            default: 'en_attente',
          },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    clientRating: { type: Number, min: 1, max: 5 },
    clientComment: { type: String },
    expertRating: { type: Number, min: 1, max: 5 },
    artisanRating: { type: Number, min: 1, max: 5 },

    projectCategory: {
      type: String,
      enum: [
        'renovation_simple',
        'renovation_complexe',
        'construction_neuve',
        'gros_oeuvre',
        'installation_technique',
        'amenagement',
        'expertise_etude',
      ],
    },
    complexity: {
      type: String,
      enum: ['simple', 'moyen', 'complexe'],
    },
    complexityReasoning: { type: String },
    requiredSkills: { type: [String], default: [] },
    requiredWorkerTypes: { type: [String], default: [] },
    surface: { type: Number, min: 0 },
    /** Géolocalisation projet (matching Express / IA) */
    location: {
      lat: { type: Number },
      lng: { type: Number },
      city: { type: String },
      gouvernorat: { type: String },
    },
    /** Budget (alias métier ; peut dupliquer budget_estime selon les flux) */
    budget: { type: Number, min: 0 },

    /** Statut du workflow de matching automatique */
    matchingStatus: {
      type: String,
      enum: ['pending', 'matched', 'searching'],
      default: 'pending',
    },
    assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    aiMatches: { type: [aiMatchSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
