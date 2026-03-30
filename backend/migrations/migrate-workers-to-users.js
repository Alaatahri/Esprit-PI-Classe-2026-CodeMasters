/**
 * Migre les documents de la collection workers vers users (même _id si possible).
 * À exécuter une fois après mise à jour du code : node backend/migrations/migrate-workers-to-users.js
 */

const mongoose = require('mongoose');
const path = require('path');

const User = require(path.join(__dirname, '..', 'models', 'User.js'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bmp-tn';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const coll = db.collection('workers');
  const n = await coll.countDocuments();
  if (n === 0) {
    console.log('Aucun document dans workers — rien à migrer.');
    await mongoose.disconnect();
    return;
  }

  const workers = await coll.find().toArray();
  console.log(`Migration de ${workers.length} document(s) workers → users…`);

  for (const w of workers) {
    const doc = {
      _id: w._id,
      nom: w.name,
      email: w.email,
      mot_de_passe: 'seedWorker123',
      role: w.workerType,
      telephone: w.phone || '',
      specialite: w.specialite,
      experience_annees: w.experienceYears ?? 0,
      zones_travail: [{ scope: 'tn_all' }],
      skills: w.skills || [],
      bio: w.bio || '',
      rating: w.rating ?? 0,
      reviewsCount: w.reviewsCount ?? 0,
      activeProjects: w.activeProjects ?? 0,
      certifications: w.certifications || [],
      dailyRate: w.dailyRate,
      projectTypes: w.projectTypes || [],
      isAvailable: w.isAvailable !== false,
      location: w.location,
    };

    try {
      await User.collection.replaceOne({ _id: w._id }, doc, { upsert: true });
      console.log(`  OK ${w.email}`);
    } catch (e) {
      if (e.code === 11000) {
        const existing = await User.findOne({ email: w.email });
        if (existing && String(existing._id) !== String(w._id)) {
          console.warn(
            `  Conflit email ${w.email} — fusion manuelle requise (id worker ${w._id} vs user ${existing._id}).`,
          );
        }
      } else {
        throw e;
      }
    }
  }

  try {
    await coll.drop();
    console.log('Collection workers supprimée.');
  } catch (e) {
    console.warn('Impossible de supprimer workers :', e.message);
  }

  await mongoose.disconnect();
  console.log('Terminé.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
