/**
 * Seed profils terrain + projets de test (collection users uniquement).
 * Exécution : node backend/seeders/workers.seed.js
 */

const path = require('path');
const mongoose = require('mongoose');

const modelsDir = path.join(__dirname, '..', 'models');
const User = require(path.join(modelsDir, 'User.js'));
const Project = require(path.join(modelsDir, 'Project.js'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bmp-tn';

const SEED_CLIENT_ID = new mongoose.Types.ObjectId('64f0a1b2c3d4e5f678901234');

const DEFAULT_PASSWORD = 'seedWorker123';

const WORKERS = [
  {
    name: 'Mohamed Trabelsi',
    email: 'mohamed.trabelsi@seed.bmp.tn',
    workerType: 'artisan',
    specialite: 'carrelage',
    skills: ['carrelage', 'faïence', 'mosaïque', 'ragréage', 'jointage'],
    bio: "Carreleur professionnel avec 12 ans d'expérience en rénovation résidentielle et commerciale.",
    experienceYears: 12,
    rating: 4.8,
    reviewsCount: 47,
    activeProjects: 1,
    dailyRate: 120,
    isAvailable: true,
    projectTypes: ['simple', 'moyen'],
    location: {
      lat: 36.8065,
      lng: 10.1815,
      city: 'Tunis',
      gouvernorat: 'Tunis',
    },
  },
  {
    name: 'Karim Mansouri',
    email: 'karim.mansouri@seed.bmp.tn',
    workerType: 'electricien',
    specialite: 'electricite_courante',
    skills: ['tableau électrique', 'câblage', 'prises', 'éclairage', 'domotique', 'alarme'],
    bio: 'Électricien certifié, spécialisé installation résidentielle et domotique.',
    experienceYears: 8,
    rating: 4.6,
    reviewsCount: 33,
    activeProjects: 0,
    dailyRate: 150,
    isAvailable: true,
    projectTypes: ['simple', 'moyen'],
    location: {
      lat: 36.8748,
      lng: 10.1715,
      city: 'Ariana',
      gouvernorat: 'Ariana',
    },
  },
  {
    name: 'Sami Bouazizi',
    email: 'sami.bouazizi@seed.bmp.tn',
    workerType: 'artisan',
    specialite: 'plomberie',
    skills: ['plomberie', 'sanitaire', 'soudure cuivre', 'chauffe-eau', 'robinetterie'],
    bio: 'Plombier expérimenté, installations complètes et dépannage rapide.',
    experienceYears: 15,
    rating: 4.9,
    reviewsCount: 61,
    activeProjects: 1,
    dailyRate: 140,
    isAvailable: true,
    projectTypes: ['simple', 'moyen'],
    location: {
      lat: 36.819,
      lng: 10.1658,
      city: 'La Soukra',
      gouvernorat: 'Ariana',
    },
  },
  {
    name: 'Ali Cherif',
    email: 'ali.cherif@seed.bmp.tn',
    workerType: 'ouvrier',
    specialite: 'maçonnerie',
    skills: ['maçonnerie', 'parpaing', 'enduit', 'terrassement', 'démolition'],
    bio: 'Ouvrier polyvalent, gros œuvre et travaux de démolition.',
    experienceYears: 6,
    rating: 4.2,
    reviewsCount: 18,
    activeProjects: 0,
    dailyRate: 80,
    isAvailable: true,
    projectTypes: ['simple', 'moyen', 'complexe'],
    location: {
      lat: 36.7478,
      lng: 10.235,
      city: 'Ben Arous',
      gouvernorat: 'Ben Arous',
    },
  },
  {
    name: 'Ing. Youssef Hammami',
    email: 'youssef.hammami@seed.bmp.tn',
    workerType: 'expert',
    specialite: 'genie_civil',
    skills: ['béton armé', 'calcul structure', 'fondations', 'suivi chantier', 'BAEL', 'Eurocode'],
    bio: "Ingénieur génie civil 20 ans d'expérience, maîtrise calcul structure et suivi chantier.",
    experienceYears: 20,
    rating: 4.9,
    reviewsCount: 84,
    activeProjects: 2,
    dailyRate: 400,
    isAvailable: true,
    projectTypes: ['complexe'],
    location: {
      lat: 36.802,
      lng: 10.1797,
      city: 'Tunis',
      gouvernorat: 'Tunis',
    },
  },
  {
    name: 'Arch. Lina Nasri',
    email: 'lina.nasri@seed.bmp.tn',
    workerType: 'architecte',
    specialite: 'architecture',
    skills: ['plans', 'permis construire', 'suivi travaux', 'design intérieur', 'AutoCAD', 'BIM'],
    bio: 'Architecte DPLG, conception et suivi de projets résidentiels et commerciaux.',
    experienceYears: 11,
    rating: 4.7,
    reviewsCount: 39,
    activeProjects: 1,
    dailyRate: 350,
    isAvailable: true,
    projectTypes: ['complexe'],
    location: {
      lat: 36.8978,
      lng: 10.1878,
      city: 'La Marsa',
      gouvernorat: 'Tunis',
    },
  },
  {
    name: 'Nabil Sfar',
    email: 'nabil.sfar@seed.bmp.tn',
    workerType: 'artisan',
    specialite: 'peinture',
    skills: ['peinture', 'enduit', 'crépi', 'décoration', 'résine époxy'],
    bio: 'Peintre décorateur, finitions soignées pour intérieur et extérieur.',
    experienceYears: 9,
    rating: 4.4,
    reviewsCount: 27,
    activeProjects: 0,
    dailyRate: 100,
    isAvailable: true,
    projectTypes: ['simple', 'moyen'],
    location: {
      lat: 36.819,
      lng: 10.305,
      city: 'Manouba',
      gouvernorat: 'Manouba',
    },
  },
  {
    name: 'Hedi Jlassi',
    email: 'hedi.jlassi@seed.bmp.tn',
    workerType: 'artisan',
    specialite: 'menuiserie_alu',
    skills: ['menuiserie alu', 'portes', 'fenêtres', 'vérandas', 'PVC', 'vitrage'],
    bio: 'Menuisier aluminium, fabrication et pose portes, fenêtres et façades.',
    experienceYears: 14,
    rating: 4.6,
    reviewsCount: 52,
    activeProjects: 1,
    dailyRate: 160,
    isAvailable: true,
    projectTypes: ['simple', 'moyen'],
    location: {
      lat: 36.748,
      lng: 10.175,
      city: 'Ben Arous',
      gouvernorat: 'Ben Arous',
    },
  },
  {
    name: 'Riadh Karray',
    email: 'riadh.karray@seed.bmp.tn',
    workerType: 'artisan',
    specialite: 'climatisation',
    skills: ['climatisation', 'split', 'VRV', 'ventilation', 'chauffage'],
    bio: 'Technicien HVAC certifié, installation et maintenance climatisation.',
    experienceYears: 7,
    rating: 4.3,
    reviewsCount: 22,
    activeProjects: 0,
    dailyRate: 130,
    isAvailable: true,
    projectTypes: ['simple', 'moyen'],
    location: {
      lat: 36.8587,
      lng: 10.3327,
      city: 'Bardo',
      gouvernorat: 'Tunis',
    },
  },
  {
    name: 'Fares Oueslati',
    email: 'fares.oueslati@seed.bmp.tn',
    workerType: 'electricien',
    specialite: 'panneaux_solaires',
    skills: ['panneaux solaires', 'onduleur', 'câblage DC', 'autoconsommation', 'réseau'],
    bio: 'Électricien spécialisé énergie solaire photovoltaïque, installations résidentielles.',
    experienceYears: 5,
    rating: 4.5,
    reviewsCount: 19,
    activeProjects: 1,
    dailyRate: 180,
    isAvailable: true,
    projectTypes: ['moyen', 'complexe'],
    location: {
      lat: 36.8948,
      lng: 10.1855,
      city: 'La Marsa',
      gouvernorat: 'Tunis',
    },
  },
];

function toUserDoc(w) {
  return {
    nom: w.name,
    email: w.email,
    mot_de_passe: DEFAULT_PASSWORD,
    role: w.workerType,
    telephone: '',
    specialite: w.specialite,
    experience_annees: w.experienceYears,
    zones_travail: [{ scope: 'tn_all' }],
    skills: w.skills || [],
    bio: w.bio || '',
    rating: w.rating ?? 0,
    reviewsCount: w.reviewsCount ?? 0,
    activeProjects: w.activeProjects ?? 0,
    certifications: [],
    dailyRate: w.dailyRate,
    projectTypes: w.projectTypes || [],
    isAvailable: w.isAvailable !== false,
    location: w.location,
  };
}

function buildProjects() {
  const now = new Date();
  const inSixMonths = new Date(now);
  inSixMonths.setMonth(inSixMonths.getMonth() + 6);

  const raw = [
    {
      title: 'Peinture salon 40m²',
      projectCategory: 'renovation_simple',
      budget: 800,
      description:
        'Peinture murs et plafond salon séjour, couleur beige clair, préparation surface incluse',
      requiredSkills: ['peinture', 'enduit'],
      surface: 40,
      status: 'pending',
      location: {
        lat: 36.8065,
        lng: 10.1815,
        city: 'Tunis',
        gouvernorat: 'Tunis',
      },
    },
    {
      title: 'Rénovation complète appartement 90m²',
      projectCategory: 'renovation_complexe',
      budget: 18000,
      description:
        'Rénovation totale appartement: carrelage toutes pièces, peinture, plomberie salle de bain, tableau électrique',
      requiredSkills: ['carrelage', 'peinture', 'plomberie', 'tableau électrique'],
      surface: 90,
      status: 'pending',
      location: {
        lat: 36.8748,
        lng: 10.1715,
        city: 'Ariana',
        gouvernorat: 'Ariana',
      },
    },
    {
      title: 'Construction villa R+1 La Soukra',
      projectCategory: 'construction_neuve',
      budget: 280000,
      description:
        'Construction neuve villa R+1 avec sous-sol, fondations, dalle, élévation murs, toiture, finitions complètes',
      requiredSkills: ['gros œuvre', 'béton armé', 'fondations', 'maçonnerie', 'plans architecte'],
      surface: 220,
      status: 'pending',
      location: {
        lat: 36.819,
        lng: 10.1658,
        city: 'La Soukra',
        gouvernorat: 'Ariana',
      },
    },
  ];

  return raw.map((p) => ({
    titre: p.title,
    description: p.description,
    date_debut: now,
    date_fin_prevue: inSixMonths,
    budget_estime: p.budget,
    budget: p.budget,
    statut: 'En attente',
    avancement_global: 0,
    clientId: SEED_CLIENT_ID,
    projectCategory: p.projectCategory,
    requiredSkills: p.requiredSkills,
    surface: p.surface,
    location: p.location,
    matchingStatus: p.status === 'pending' ? 'pending' : 'pending',
    aiMatches: [],
  }));
}

async function run() {
  console.log('Connexion MongoDB…', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const emails = WORKERS.map((w) => w.email);
  const del = await User.deleteMany({ email: { $in: emails } });
  console.log(`Anciens profils seed supprimés (users) : ${del.deletedCount}`);

  const docs = WORKERS.map(toUserDoc);
  const inserted = await User.insertMany(docs);
  console.log(`Profils terrain insérés (users) : ${inserted.length}`);

  const pDel = await Project.deleteMany({});
  console.log(`Projets supprimés : ${pDel.deletedCount}`);

  const projects = await Project.insertMany(buildProjects());
  console.log(`Projets insérés : ${projects.length}`);
  projects.forEach((p) => {
    console.log(`  - ${p.titre} (${p._id})`);
  });

  await mongoose.disconnect();
  console.log('Terminé. Connexion : email @seed.bmp.tn / mot de passe', DEFAULT_PASSWORD);
}

run().catch((err) => {
  console.error('Erreur seed :', err);
  process.exit(1);
});
