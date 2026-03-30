/**
 * Modèle Mongoose aligné sur backend/src/user/schemas/user.schema.ts (Nest).
 * Collection unique : users (plus de collection workers).
 */
const mongoose = require('mongoose');

const USER_ROLES = [
  'client',
  'expert',
  'artisan',
  'manufacturer',
  'admin',
  'ouvrier',
  'electricien',
  'architecte',
];

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mot_de_passe: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: USER_ROLES },
    telephone: { type: String, trim: true },
    specialite: { type: String, trim: true },
    experience_annees: { type: Number, min: 0 },
    zones_travail: { type: Array, default: [] },
    skills: { type: [String], default: [] },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    activeProjects: { type: Number, default: 0, min: 0 },
    certifications: { type: [String], default: [] },
    dailyRate: { type: Number, min: 0 },
    projectTypes: {
      type: [{ type: String, enum: ['simple', 'moyen', 'complexe'] }],
      default: [],
    },
    isAvailable: { type: Boolean, default: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      city: { type: String, trim: true },
      gouvernorat: { type: String, trim: true },
    },
  },
  { timestamps: true, collection: 'users' },
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
