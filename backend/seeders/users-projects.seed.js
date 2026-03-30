/**
 * Ajoute des utilisateurs + projets de démo pour tests (Nest + MongoDB).
 * N’efface pas les données existantes : upsert par email pour les users.
 *
 * Usage : node backend/seeders/users-projects.seed.js
 *    ou : cd backend && npm run seed:demo
 */

const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bmp-tn';

/* Schéma aligné sur backend/src/user/schemas/user.schema.ts (Nest) */
const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mot_de_passe: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ['client', 'expert', 'artisan', 'manufacturer', 'admin'],
    },
    telephone: String,
    specialite: String,
    experience_annees: Number,
    zones_travail: { type: Array, default: [] },
  },
  { timestamps: true, collection: 'users' },
);

const User =
  mongoose.models.User || mongoose.model('User', userSchema);

const Project = require(path.join(__dirname, '..', 'models', 'Project.js'));

const DEMO_USERS = [
  {
    nom: 'Client Démo Alpha',
    email: 'client.demo@bmp.tn',
    mot_de_passe: 'password123',
    role: 'client',
    telephone: '+216 11 111 111',
  },
  {
    nom: 'Client Démo Beta',
    email: 'client2.demo@bmp.tn',
    mot_de_passe: 'password123',
    role: 'client',
    telephone: '+216 22 222 222',
  },
  {
    nom: 'Admin Démo',
    email: 'admin.demo@bmp.tn',
    mot_de_passe: 'admin123',
    role: 'admin',
    telephone: '+216 99 000 001',
  },
  {
    nom: 'Expert Démo',
    email: 'expert.demo@bmp.tn',
    mot_de_passe: 'password123',
    role: 'expert',
    telephone: '+216 55 444 333',
  },
  {
    nom: 'Artisan Démo',
    email: 'artisan.demo@bmp.tn',
    mot_de_passe: 'password123',
    role: 'artisan',
    telephone: '+216 77 888 999',
    specialite: 'Plomberie',
    experience_annees: 8,
    zones_travail: [{ scope: 'tn_all' }],
  },
];

function buildProjects(clientId) {
  const now = new Date();
  const fin = new Date(now);
  fin.setMonth(fin.getMonth() + 6);

  return [
    {
      titre: 'Réfection toiture — Sidi Bou Said',
      description:
        'Réparation étanchéité et tuiles, zinguerie gouttières. Devis détaillé souhaité.',
      budget_estime: 12500,
      budget: 12500,
      statut: 'En attente',
      avancement_global: 0,
      clientId,
      projectCategory: 'renovation_complexe',
      complexity: 'moyen',
      requiredSkills: ['couverture', 'étanchéité'],
      surface: 140,
      matchingStatus: 'pending',
      location: {
        lat: 36.8709,
        lng: 10.3415,
        city: 'Sidi Bou Said',
        gouvernorat: 'Tunis',
      },
      requiredWorkerTypes: ['artisan'],
      aiMatches: [],
    },
    {
      titre: 'Réfection salle de bain 12m²',
      description:
        'Dépose ancien carrelage, nouvelle installation sanitaire, faïence et robinetterie.',
      budget_estime: 9500,
      budget: 9500,
      statut: 'En attente',
      avancement_global: 0,
      clientId,
      projectCategory: 'renovation_simple',
      complexity: 'simple',
      requiredSkills: ['plomberie', 'carrelage'],
      surface: 12,
      matchingStatus: 'pending',
      location: {
        lat: 36.8065,
        lng: 10.1815,
        city: 'Tunis',
        gouvernorat: 'Tunis',
      },
      requiredWorkerTypes: ['artisan'],
      aiMatches: [],
    },
    {
      titre: 'Extension bureaux — Zone industrielle',
      description:
        'Extension structure métallique, dalle, raccordements électriques et réseaux.',
      budget_estime: 85000,
      budget: 85000,
      statut: 'En cours',
      avancement_global: 35,
      clientId,
      projectCategory: 'construction_neuve',
      complexity: 'complexe',
      requiredSkills: ['gros œuvre', 'électricité', 'structure'],
      surface: 320,
      matchingStatus: 'searching',
      location: {
        lat: 36.8065,
        lng: 10.1815,
        city: 'Tunis',
        gouvernorat: 'Tunis',
      },
      requiredWorkerTypes: ['expert', 'artisan', 'electricien'],
      aiMatches: [],
    },
    {
      titre: 'Mise aux normes tableau électrique',
      description:
        'Mise à jour tableau électrique, différentiels, mise à la terre, conformité.',
      budget_estime: 2200,
      budget: 2200,
      statut: 'En attente',
      avancement_global: 0,
      clientId,
      projectCategory: 'installation_technique',
      complexity: 'simple',
      requiredSkills: ['électricité', 'tableau'],
      surface: 0,
      matchingStatus: 'pending',
      location: {
        lat: 36.8748,
        lng: 10.1715,
        city: 'Ariana',
        gouvernorat: 'Ariana',
      },
      requiredWorkerTypes: ['electricien'],
      aiMatches: [],
    },
  ].map((p) => ({
    ...p,
    description: p.description,
    date_debut: now,
    date_fin_prevue: fin,
  }));
}

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`  (existant) ${data.email}`);
    return existing;
  }
  const u = await User.create(data);
  console.log(`  + créé ${data.email} (${u._id})`);
  return u;
}

async function run() {
  console.log('Connexion MongoDB…', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log('\n--- Utilisateurs démo ---');
  const users = [];
  for (const u of DEMO_USERS) {
    users.push(await upsertUser(u));
  }

  const client =
    users.find((u) => u.email === 'client.demo@bmp.tn') || users[0];

  if (!client?._id) {
    throw new Error('Aucun client démo.');
  }

  const clientId = client._id;

  const existingTitles = await Project.find({
    titre: {
      $in: [
        'Réfection toiture — Sidi Bou Said',
        'Réfection salle de bain 12m²',
        'Extension bureaux — Zone industrielle',
        'Mise aux normes tableau électrique',
      ],
    },
  })
    .select('titre')
    .lean();

  const existingSet = new Set(existingTitles.map((p) => p.titre));
  const toInsert = buildProjects(clientId).filter((p) => !existingSet.has(p.titre));

  console.log('\n--- Projets démo ---');
  if (toInsert.length === 0) {
    console.log('  Aucun nouveau projet (titres déjà présents).');
  } else {
    const inserted = await Project.insertMany(toInsert);
    inserted.forEach((p) => {
      console.log(`  + ${p.titre} (${p._id})`);
    });
  }

  console.log('\n--- Connexion rapide (Nest /api) ---');
  console.log('  Client : client.demo@bmp.tn / password123');
  console.log('  Admin  : admin.demo@bmp.tn / admin123');
  console.log('  Artisan: artisan.demo@bmp.tn / password123');

  await mongoose.disconnect();
  console.log('\nTerminé.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
