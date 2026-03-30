const mongoose = require('mongoose');

/**
 * Collection Expert — profils métier pour le matching IA.
 * Peut être liée à un User via userId (optionnel).
 */
const expertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    skills: { type: [String], default: [] },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    activeProjects: { type: Number, default: 0, min: 0 },
    experienceYears: { type: Number, default: 0, min: 0 },
    workerType: { type: String, default: 'artisan' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Expert || mongoose.model('Expert', expertSchema);
