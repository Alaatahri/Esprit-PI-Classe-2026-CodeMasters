import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { ProjectService } from '../project/project.service';
import { SuiviProjectService } from '../suivi-project/suivi-project.service';
import { DevisService } from '../devis/devis.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import {
  SuiviProject,
  SuiviProjectDocument,
} from '../suivi-project/schemas/suivi-project.schema';
import { Alert, AlertDocument } from '../alerts/schemas/alert.schema';
import { Model, Types } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  const projectService = app.get(ProjectService);
  const suiviProjectService = app.get(SuiviProjectService);
  const suiviProjectModel = app.get<Model<SuiviProjectDocument>>(
    getModelToken(SuiviProject.name),
  );
  const alertModel = app.get<Model<AlertDocument>>(getModelToken(Alert.name));
  const devisService = app.get(DevisService);
  const marketplaceService = app.get(MarketplaceService);

  console.log('🌱 Starting database seeding...\n');

  try {
    // Vérifier les données existantes
    const existingUsers = await userService.findAll();
    const existingProjects = await projectService.findAll();

    let client, client2, client3, expert, artisan, manufacturer, admin;
    let projects: any[] = [];

    // Créer des utilisateurs de test
    if (existingUsers.length === 0) {
      console.log('📝 Creating test users...');

      // Clients de démo
      client = await userService.create({
        nom: 'Ahmed Ben Ali',
        email: 'ahmed@example.com',
        mot_de_passe: 'password123',
        role: 'client',
        telephone: '+216 12 345 678',
      });

      client2 = await userService.create({
        nom: 'Leila Gharbi',
        email: 'leila@example.com',
        mot_de_passe: 'password123',
        role: 'client',
        telephone: '+216 21 222 333',
      });

      client3 = await userService.create({
        nom: 'Omar Haddad',
        email: 'omar@example.com',
        mot_de_passe: 'password123',
        role: 'client',
        telephone: '+216 23 444 555',
      });

      // Expert / artisan / fabricant / admin
      expert = await userService.create({
        prenom: 'Sara',
        nom: 'Trabelsi',
        email: 'sara@example.com',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 98 765 432',
        competences: ['peinture', 'rénovation', 'plomberie', 'électricité'],
        isAvailable: true,
        rating: 4.3,
        experienceYears: 6,
      });

      artisan = await userService.create({
        nom: 'Mohamed Khelifi',
        email: 'mohamed@example.com',
        mot_de_passe: 'password123',
        role: 'artisan',
        telephone: '+216 55 123 456',
        specialite: 'Maçonnerie',
        experience_annees: 7,
        zones_travail: [
          { scope: 'tn_all' },
          { scope: 'country', value: 'France' },
        ],
      });

      manufacturer = await userService.create({
        nom: 'Fatma Mansouri',
        email: 'fatma@example.com',
        mot_de_passe: 'password123',
        role: 'manufacturer',
        telephone: '+216 77 888 999',
      });

      admin = await userService.create({
        nom: 'Admin BMP',
        email: 'admin@bmp.tn',
        mot_de_passe: 'admin123',
        role: 'admin',
        telephone: '+216 99 000 111',
      });

      console.log('✅ Users created:', {
        client: client._id,
        client2: client2._id,
        client3: client3._id,
        expert: expert._id,
        artisan: artisan._id,
        manufacturer: manufacturer._id,
        admin: admin._id,
      });
    } else {
      console.log('📋 Using existing users...');
      const clients = existingUsers.filter((u) => u.role === 'client');
      client = clients[0] || existingUsers[0];
      client2 = clients[1];
      client3 = clients[2];
      expert =
        existingUsers.find((u) => u.role === 'expert') || existingUsers[0];
      artisan =
        existingUsers.find((u) => u.email === 'mohamed@example.com') ||
        existingUsers.find((u) => u.role === 'artisan');
      manufacturer = existingUsers.find((u) => u.role === 'manufacturer');
      admin = existingUsers.find((u) => u.role === 'admin');
    }

    // Toujours utiliser Ahmed comme client principal des démos (login ahmed@example.com)
    const ahmedResolved = await userService.findByEmail('ahmed@example.com');
    if (ahmedResolved) {
      client = ahmedResolved as any;
      console.log('📌 Client démo principal: ahmed@example.com');
    }

    // S'assurer qu'il existe plusieurs experts avec competences pour tester le matching
    const demoExperts = [
      {
        prenom: 'Youssef',
        nom: 'Ben Youssef',
        email: 'expert.peinture@bmp.tn',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 20 100 200',
        competences: ['peinture', 'revêtement'],
        isAvailable: true,
        rating: 4.8,
        experienceYears: 9,
      },
      {
        prenom: 'Ines',
        nom: 'Trabelsi',
        email: 'expert.reno@bmp.tn',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 20 300 400',
        competences: ['rénovation', 'plomberie', 'électricité', 'carrelage'],
        isAvailable: true,
        rating: 4.4,
        experienceYears: 7,
      },
      {
        prenom: 'Hatem',
        nom: 'Khelifi',
        email: 'expert.structure@bmp.tn',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 20 500 600',
        competences: ['maçonnerie', 'construction', 'toiture'],
        isAvailable: true,
        rating: 4.1,
        experienceYears: 10,
      },
      {
        prenom: 'Mariem',
        nom: 'Gharbi',
        email: 'expert.off@bmp.tn',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 20 700 800',
        competences: ['peinture', 'carrelage'],
        isAvailable: false,
        rating: 4.9,
        experienceYears: 10,
      },
      // Experts supplémentaires pour tests (plus de diversité)
      {
        prenom: 'Sami',
        nom: 'Haddad',
        email: 'expert.elec@bmp.tn',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 20 111 222',
        competences: ['électricité', 'rénovation'],
        isAvailable: true,
        rating: 4.0,
        experienceYears: 5,
      },
      {
        prenom: 'Nour',
        nom: 'Mansouri',
        email: 'expert.plomberie@bmp.tn',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 20 333 444',
        competences: ['plomberie', 'rénovation'],
        isAvailable: true,
        rating: 4.6,
        experienceYears: 8,
      },
      {
        prenom: 'Amir',
        nom: 'Ben Salah',
        email: 'expert.carrelage@bmp.tn',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 20 555 666',
        competences: ['carrelage', 'revêtement', 'rénovation'],
        isAvailable: true,
        rating: 4.2,
        experienceYears: 6,
      },
    ];

    for (const ex of demoExperts) {
      const existing = await userService.findByEmail(ex.email);
      if (!existing) {
        await userService.create(ex as any);
      } else {
        await userService.update(
          (existing as any)._id?.toString?.() ?? (existing as any)._id,
          {
            prenom: (ex as any).prenom,
            nom: (ex as any).nom,
            competences: (ex as any).competences,
            isAvailable: (ex as any).isAvailable,
            rating: (ex as any).rating,
            experienceYears: (ex as any).experienceYears,
          } as any,
        );
      }
    }

    // Créer des projets de test
    if (existingProjects.length === 0) {
      console.log('\n📝 Creating test projects for different clients...');

      const clientForProject1 = client;
      const clientForProject2 = client2 || client;
      const clientForProject3 = client3 || client;

      const project1 = await projectService.create({
        titre: 'Construction Villa Moderne',
        description:
          "Construction d'une villa moderne de 250m² avec jardin et piscine. Projet incluant 4 chambres, salon, cuisine équipée, et terrasse panoramique.",
        date_debut: new Date('2024-01-15'),
        date_fin_prevue: new Date('2024-12-31'),
        budget_estime: 350000,
        statut: 'En cours',
        avancement_global: 45,
        clientId: new Types.ObjectId(clientForProject1._id),
        expertId: new Types.ObjectId(expert._id),
      });

      const project2 = await projectService.create({
        titre: 'Rénovation Appartement',
        description:
          "Rénovation complète d'un appartement de 80m² incluant électricité, plomberie, carrelage et peinture.",
        date_debut: new Date('2024-03-01'),
        date_fin_prevue: new Date('2024-06-30'),
        budget_estime: 45000,
        statut: 'En attente',
        avancement_global: 0,
        clientId: new Types.ObjectId(clientForProject2._id),
      });

      const project3 = await projectService.create({
        titre: 'Extension Maison',
        description:
          'Extension de 50m² pour une maison existante avec nouvelle chambre et salle de bain.',
        date_debut: new Date('2023-06-01'),
        date_fin_prevue: new Date('2024-02-28'),
        budget_estime: 75000,
        statut: 'Terminé',
        avancement_global: 100,
        clientId: new Types.ObjectId(clientForProject3._id),
        expertId: new Types.ObjectId(expert._id),
        applications: artisan
          ? [
              {
                artisanId: new Types.ObjectId(artisan._id),
                statut: 'acceptee',
                createdAt: new Date('2023-06-10'),
              },
            ]
          : [],
        artisanRating: 5,
        clientComment:
          'Très bon artisan: travail propre, délais respectés, excellente communication.',
      });

      const project4 = await projectService.create({
        titre: 'Construction Immeuble Résidentiel',
        description:
          "Construction d'un immeuble de 6 étages avec 12 appartements, parking souterrain et espaces communs.",
        date_debut: new Date('2024-02-01'),
        date_fin_prevue: new Date('2025-08-31'),
        budget_estime: 1200000,
        statut: 'En cours',
        avancement_global: 25,
        clientId: new Types.ObjectId(client._id),
        expertId: new Types.ObjectId(expert._id),
      });

      const project5 = await projectService.create({
        titre: 'Aménagement Bureau',
        description:
          "Aménagement complet d'un espace de bureau de 200m² avec cloisons, éclairage LED et mobilier sur mesure.",
        date_debut: new Date('2024-04-15'),
        date_fin_prevue: new Date('2024-07-15'),
        budget_estime: 85000,
        statut: 'En cours',
        avancement_global: 60,
        clientId: new Types.ObjectId(client._id),
      });

      projects = [project1, project2, project3, project4, project5];
      console.log('✅ Projects created:', projects.length);
    } else {
      console.log('📋 Using existing projects...');
      projects = existingProjects;

      // S'assurer qu'il existe quelques projets "En attente" pour tests artisans
      const demoTitles = [
        'Projet test – Rénovation salle de bain',
        'Projet test – Peinture appartement',
        'Projet test – Petit aménagement extérieur',
      ];

      const missingDemoTitles = demoTitles.filter(
        (title) => !projects.find((p) => p.titre === title),
      );

      if (missingDemoTitles.length > 0 && client) {
        console.log(
          `\n📝 Creating additional demo projects for artisan tests (${missingDemoTitles.length})...`,
        );

        const now = new Date();

        for (const title of missingDemoTitles) {
          const created = await projectService.create({
            titre: title,
            description:
              'Projet de démo créé par le script de seed pour tester la fonctionnalité de candidature des artisans.',
            date_debut: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 7,
            ),
            date_fin_prevue: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 60,
            ),
            budget_estime: 25000,
            statut: 'En attente',
            avancement_global: 0,
            clientId: new Types.ObjectId(client._id),
          });
          projects.push(created);
        }
      }

      // S'assurer qu'il existe au moins 1 projet "Terminé" avec feedback pour l'artisan
      const artisanFeedbackTarget = artisan;
      const hasCompletedForTarget =
        !!artisanFeedbackTarget &&
        projects.some(
          (p: any) =>
            p?.statut === 'Terminé' &&
            (p?.applications || []).some(
              (a: any) =>
                a?.statut === 'acceptee' &&
                a?.artisanId?.toString?.() ===
                  artisanFeedbackTarget._id?.toString?.(),
            ),
        );

      if (!hasCompletedForTarget && client && expert && artisanFeedbackTarget) {
        const artisanFeedbackTitle = `Projet démo – Feedback artisan (terminé) – ${artisanFeedbackTarget.email}`;
        console.log(
          '\n📝 Creating demo completed project with artisan feedback...',
        );
        const created = await projectService.create({
          titre: artisanFeedbackTitle,
          description:
            "Projet de démonstration terminé afin d'afficher un profil artisan complet (note + feedback client).",
          date_debut: new Date('2024-01-05'),
          date_fin_prevue: new Date('2024-03-20'),
          budget_estime: 18000,
          statut: 'Terminé',
          avancement_global: 100,
          clientId: new Types.ObjectId(client._id),
          expertId: new Types.ObjectId(expert._id),
          applications: [
            {
              artisanId: new Types.ObjectId(artisanFeedbackTarget._id),
              statut: 'acceptee',
              createdAt: new Date('2024-01-10'),
            },
          ],
          artisanRating: 5,
          clientComment:
            'Excellent travail: finition impeccable, ponctualité et très bonne communication.',
        });
        projects.push(created);
      }
    }

    // Créer des suivis de projets
    console.log('\n📝 Creating project follow-ups...');
    const existingSuivis = await suiviProjectService.findAll();

    if (existingSuivis.length === 0 && projects.length > 0) {
      const projectEnCours = projects.find((p) => p.statut === 'En cours');
      if (projectEnCours) {
        await suiviProjectService.create({
          projectId: new Types.ObjectId(projectEnCours._id),
          date_suivi: new Date('2024-02-15'),
          description_progression:
            'Fondations terminées, début des murs porteurs. Travaux conformes au planning.',
          pourcentage_avancement: 30,
          cout_actuel: 105000,
          photo_url: 'https://example.com/photos/fondations.jpg',
        });

        await suiviProjectService.create({
          projectId: new Types.ObjectId(projectEnCours._id),
          date_suivi: new Date('2024-03-01'),
          description_progression:
            'Murs porteurs terminés, début de la charpente. Légère avance sur le planning.',
          pourcentage_avancement: 45,
          cout_actuel: 157500,
        });

        console.log('✅ Project follow-ups created: 2');
      }
    }

    // Données démo supplémentaires (idempotent) — suivi photo STEP 1 + projet pour matching
    console.log(
      '\n📝 Ensuring bonus demo data (suivi photo STEP 1, projet matching)...',
    );
    const DEMO_SUIVI_TITLE = 'Projet démo BMP – Suivi photo (STEP 1)';
    const DEMO_MATCHING_TITLE =
      'Projet démo – Matching IA (rénovation cuisine)';

    const allProjList = await projectService.findAll(500);
    let demoSuiviProject = allProjList.find(
      (p: any) => p.titre === DEMO_SUIVI_TITLE,
    );
    let demoMatchingProject = allProjList.find(
      (p: any) => p.titre === DEMO_MATCHING_TITLE,
    );

    if (client && expert && artisan) {
      if (!demoSuiviProject) {
        demoSuiviProject = await projectService.create({
          titre: DEMO_SUIVI_TITLE,
          description:
            'Chantier de démonstration pour tester photoUrl, progressIndex, progressPercent et suivi photo. ' +
            'Travaux: peinture, carrelage, plomberie.',
          date_debut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          date_fin_prevue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          budget_estime: 95000,
          statut: 'En attente',
          avancement_global: 0,
          clientId: new Types.ObjectId(client._id),
          expertId: new Types.ObjectId(expert._id),
        });
      }

      if (!demoMatchingProject) {
        demoMatchingProject = await projectService.create({
          titre: DEMO_MATCHING_TITLE,
          description:
            'Rénovation complète de cuisine avec nouveaux meubles, électricité, plomberie et carrelage mural.',
          date_debut: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          date_fin_prevue: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          budget_estime: 28000,
          statut: 'En attente',
          avancement_global: 0,
          clientId: new Types.ObjectId(client._id),
        });
      }
    }

    // Suivis avec champs STEP 1 (photoUrl, progressPercent, progressIndex, workerId, aiAnalysis)
    if (demoSuiviProject && artisan) {
      const pid = new Types.ObjectId(
        (demoSuiviProject as any)._id?.toString?.() ??
          (demoSuiviProject as any)._id,
      );
      const marker = 'demo-seed-suivi-photo';
      const exists = await suiviProjectModel.countDocuments({
        projectId: pid,
        description_progression: { $regex: marker, $options: 'i' },
      });

      if (exists === 0) {
        const wid = new Types.ObjectId(artisan._id);
        const baseDay = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const rows = [
          {
            idx: 1,
            pct: 30,
            url: 'https://picsum.photos/seed/bmp-suivi-demo1/800/600',
            note: 'Premier point de contrôle.',
          },
          {
            idx: 2,
            pct: 45,
            url: 'https://picsum.photos/seed/bmp-suivi-demo2/800/600',
            note: 'Avancement murs et début finitions.',
          },
          {
            idx: 3,
            pct: 55,
            url: 'https://picsum.photos/seed/bmp-suivi-demo3/800/600',
            note: 'Finitions en cours.',
          },
        ];

        for (const r of rows) {
          const uploadedAt = new Date(baseDay.getTime() + r.idx * 86400000);
          await suiviProjectService.create({
            projectId: pid,
            workerId: wid,
            photoUrl: r.url,
            photo_url: r.url,
            uploadedAt,
            date_suivi: uploadedAt,
            description_progression: `[${marker}] ${r.note}`,
            pourcentage_avancement: r.pct,
            progressPercent: r.pct,
            progressIndex: r.idx,
            cout_actuel: 0,
            aiAnalysis: JSON.stringify({
              percent: r.pct,
              reason: 'demo_seed',
              note: r.note,
            }),
          });
        }
        console.log(
          '✅ Bonus demo suivis created (STEP 1 fields):',
          rows.length,
        );
      } else {
        console.log('📋 Bonus demo suivis already present (skipped).');
      }
    }

    // STEP 2 — Projet + alerte démo (retard vs planning, échéance < 3 j)
    console.log('\n📝 Ensuring demo data for STEP 2 (alertes retard)...');
    const ALERT_DEMO_TITLE = 'Projet démo – Alerte retard (échéance critique)';
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    const projListForAlert = await projectService.findAll(500);
    let alertDemoProject = projListForAlert.find(
      (p: any) => p.titre === ALERT_DEMO_TITLE,
    );

    if (client && expert && artisan) {
      if (!alertDemoProject) {
        alertDemoProject = await projectService.create({
          titre: ALERT_DEMO_TITLE,
          description:
            'Chantier démo pour tester les alertes retard (STEP 2). Avancement volontairement bas par rapport au planning linéaire.',
          date_debut: new Date(Date.now() - ninetyDaysMs),
          date_fin_prevue: new Date(Date.now() + twoDaysMs),
          budget_estime: 120000,
          statut: 'En cours',
          avancement_global: 12,
          clientId: new Types.ObjectId(client._id),
          expertId: new Types.ObjectId(expert._id),
        });
        console.log(
          '✅ Demo alert project created (avancement 12 %, fin dans ~2 j)',
        );

        const pid = new Types.ObjectId(
          (alertDemoProject as any)._id?.toString?.() ??
            (alertDemoProject as any)._id,
        );
        const wid = new Types.ObjectId(artisan._id);
        const totalMs =
          new Date(alertDemoProject.date_fin_prevue).getTime() -
          new Date(alertDemoProject.date_debut).getTime();
        const totalDays = Math.max(totalMs / (1000 * 60 * 60 * 24), 1);
        const today = new Date();
        const daysElapsed =
          (today.getTime() - new Date(alertDemoProject.date_debut).getTime()) /
          (1000 * 60 * 60 * 24);
        const expectedProgress = Math.min(
          Math.max((daysElapsed / totalDays) * 100, 0),
          100,
        );
        const daysRemaining =
          (new Date(alertDemoProject.date_fin_prevue).getTime() -
            today.getTime()) /
          (1000 * 60 * 60 * 24);

        const existingAlert = await alertModel.countDocuments({
          projectId: pid,
        });
        if (existingAlert === 0) {
          await alertModel.create({
            projectId: pid,
            workerId: wid,
            alertDate: new Date(),
            expectedProgress: Math.round(expectedProgress * 10) / 10,
            realProgress: 12,
            daysRemaining: Math.round(daysRemaining * 10) / 10,
            status: 'pending',
          });
          console.log(
            '✅ Demo alert document created in collection `alerts` (STEP 2)',
          );
        }
      } else {
        const pid = new Types.ObjectId(
          (alertDemoProject as any)._id?.toString?.() ??
            (alertDemoProject as any)._id,
        );
        const wid = new Types.ObjectId(artisan._id);
        const existingAlert = await alertModel.countDocuments({
          projectId: pid,
        });
        if (existingAlert === 0) {
          const totalMs =
            new Date(alertDemoProject.date_fin_prevue).getTime() -
            new Date(alertDemoProject.date_debut).getTime();
          const totalDays = Math.max(totalMs / (1000 * 60 * 60 * 24), 1);
          const today = new Date();
          const daysElapsed =
            (today.getTime() -
              new Date(alertDemoProject.date_debut).getTime()) /
            (1000 * 60 * 60 * 24);
          const expectedProgress = Math.min(
            Math.max((daysElapsed / totalDays) * 100, 0),
            100,
          );
          const daysRemaining =
            (new Date(alertDemoProject.date_fin_prevue).getTime() -
              today.getTime()) /
            (1000 * 60 * 60 * 24);
          await alertModel.create({
            projectId: pid,
            workerId: wid,
            alertDate: new Date(),
            expectedProgress: Math.round(expectedProgress * 10) / 10,
            realProgress:
              typeof alertDemoProject.avancement_global === 'number'
                ? alertDemoProject.avancement_global
                : 12,
            daysRemaining: Math.round(daysRemaining * 10) / 10,
            status: 'pending',
          });
          console.log(
            '✅ Demo alert document created in collection `alerts` (STEP 2)',
          );
        }
      }
    }

    // Créer des devis
    console.log('\n📝 Creating quotes (devis)...');
    const existingDevis = await devisService.findAll();

    if (existingDevis.length === 0 && projects.length > 0) {
      const project1 = projects[0];
      const devis1 = await devisService.create({
        titre: 'Rénovation Villa Marsa',
        id_project: new Types.ObjectId(project1._id),
        id_client: new Types.ObjectId(client._id),
        id_artisan: new Types.ObjectId(artisan._id),
        statut: 'accepté',
        date_creation: new Date('2024-01-10'),
        articles: [
          {
            nom: 'Travaux de terrassement et fondations',
            quantite: 1,
            prix_unitaire: 45000,
            total: 45000,
          },
          {
            nom: 'Maçonnerie et structure',
            quantite: 1,
            prix_unitaire: 120000,
            total: 120000,
          },
          {
            nom: 'Charpente et couverture',
            quantite: 1,
            prix_unitaire: 85000,
            total: 85000,
          },
        ],
      });

      console.log('✅ Quotes created: 1 with 3 items');
    }

    // Créer des produits marketplace
    console.log('\n📝 Creating marketplace products...');
    const existingProduits = await marketplaceService.findAllProduits();

    if (existingProduits.length === 0 && manufacturer) {
      const produit1 = await marketplaceService.createProduit({
        nom: 'Ciment Portland CPJ45',
        description:
          'Ciment de qualité supérieure pour tous types de travaux de construction',
        prix: 12.5,
        stock: 500,
        image_url: 'https://example.com/products/ciment.jpg',
        vendeurId: new Types.ObjectId(manufacturer._id),
      });

      const produit2 = await marketplaceService.createProduit({
        nom: 'Briques Rouges 20x10x5',
        description: 'Briques en terre cuite pour construction traditionnelle',
        prix: 0.85,
        stock: 10000,
        image_url: 'https://example.com/products/briques.jpg',
        vendeurId: new Types.ObjectId(manufacturer._id),
      });

      await marketplaceService.createProduit({
        nom: 'Tôles Galvanisées',
        description: 'Tôles en acier galvanisé pour toiture, épaisseur 0.5mm',
        prix: 25.0,
        stock: 200,
        image_url: 'https://example.com/products/toles.jpg',
        vendeurId: new Types.ObjectId(manufacturer._id),
      });

      console.log('✅ Products created: 3');

      // Créer une commande
      if (client) {
        const commande = await marketplaceService.createCommande({
          clientId: new Types.ObjectId(client._id),
          montant_total: 0,
          statut: 'En attente',
          date_commande: new Date('2024-02-20'),
        });

        await marketplaceService.createCommandeItem({
          commandeId: new Types.ObjectId((commande as any)._id),
          produitId: new Types.ObjectId((produit1 as any)._id),
          quantite: 50,
          prix: 12.5,
        });

        await marketplaceService.createCommandeItem({
          commandeId: new Types.ObjectId((commande as any)._id),
          produitId: new Types.ObjectId((produit2 as any)._id),
          quantite: 500,
          prix: 0.85,
        });

        console.log('✅ Order created: 1 with 2 items');
      }
    }

    // Lot dédié ahmed@example.com — tout visible dans l’espace client + API
    console.log(
      '\n📝 Ensuring Ahmed bundle (ahmed@example.com / password123)...',
    );
    const ahmedUser = await userService.findByEmail('ahmed@example.com');
    const saraExpert = await userService.findByEmail('sara@example.com');
    const mohamedArtisan = await userService.findByEmail('mohamed@example.com');
    if (ahmedUser && saraExpert && mohamedArtisan) {
      const ahmedId = new Types.ObjectId((ahmedUser as any)._id);
      const expertOid = new Types.ObjectId((saraExpert as any)._id);
      const artisanOid = new Types.ObjectId((mohamedArtisan as any)._id);
      const allProjectsAhmed = await projectService.findAll(600);

      const ahmedHas = (title: string) =>
        allProjectsAhmed.some(
          (p: any) =>
            p.titre === title && String(p.clientId) === String(ahmedId),
        );

      const T_SUIVI = '[AHMED TEST] Suivi photo – journal visible';
      const T_MATCH = '[AHMED TEST] Matching IA – rénovation cuisine';
      const T_ALERT = '[AHMED TEST] Alerte retard – échéance critique';

      if (!ahmedHas(T_SUIVI)) {
        const pSuivi = await projectService.create({
          titre: T_SUIVI,
          description:
            'Démo pour Ahmed : journal de suivi, photos et pourcentages. Mots-clés: peinture, carrelage.',
          date_debut: new Date(Date.now() - 25 * 86400000),
          date_fin_prevue: new Date(Date.now() + 70 * 86400000),
          budget_estime: 48000,
          statut: 'En cours',
          avancement_global: 0,
          clientId: ahmedId,
          expertId: expertOid,
        });
        const pid = new Types.ObjectId((pSuivi as any)._id);
        const suiviRows = [
          {
            idx: 1,
            pct: 28,
            desc: '[ahmed-demo] Première visite chantier — fondations OK.',
          },
          {
            idx: 2,
            pct: 45,
            desc: '[ahmed-demo] Second point — murs et début finitions.',
          },
        ];
        for (const r of suiviRows) {
          const d = new Date(Date.now() - (3 - r.idx) * 86400000);
          await suiviProjectService.create({
            projectId: pid,
            workerId: artisanOid,
            date_suivi: d,
            description_progression: r.desc,
            pourcentage_avancement: r.pct,
            cout_actuel: r.idx === 1 ? 12000 : 21000,
            photo_url: `https://picsum.photos/seed/ahmed-${r.idx}/800/600`,
            photoUrl: `https://picsum.photos/seed/ahmed-${r.idx}/800/600`,
            uploadedAt: d,
            progressPercent: r.pct,
            progressIndex: r.idx,
            aiAnalysis: JSON.stringify({ demo: 'ahmed', step: r.idx }),
          });
        }
        console.log('✅ [AHMED] Projet suivi + entrées suiviprojects');
      }

      if (!ahmedHas(T_MATCH)) {
        await projectService.create({
          titre: T_MATCH,
          description:
            'Rénovation cuisine : électricité, plomberie, carrelage mural et meubles.',
          date_debut: new Date(Date.now() - 12 * 86400000),
          date_fin_prevue: new Date(Date.now() + 50 * 86400000),
          budget_estime: 26500,
          statut: 'En attente',
          avancement_global: 0,
          clientId: ahmedId,
        });
        console.log('✅ [AHMED] Projet matching (déclenchable depuis admin)');
      }

      if (!ahmedHas(T_ALERT)) {
        const pAlert = await projectService.create({
          titre: T_ALERT,
          description: 'Démo alerte retard pour le client Ahmed (STEP 2).',
          date_debut: new Date(Date.now() - 92 * 86400000),
          date_fin_prevue: new Date(Date.now() + 2 * 86400000),
          budget_estime: 95000,
          statut: 'En cours',
          avancement_global: 11,
          clientId: ahmedId,
          expertId: expertOid,
        });
        const pidA = new Types.ObjectId((pAlert as any)._id);
        const nAlert = await alertModel.countDocuments({ projectId: pidA });
        if (nAlert === 0) {
          const start = new Date((pAlert as any).date_debut).getTime();
          const end = new Date((pAlert as any).date_fin_prevue).getTime();
          const totalDays = Math.max((end - start) / (1000 * 60 * 60 * 24), 1);
          const today = new Date();
          const daysElapsed = (today.getTime() - start) / (1000 * 60 * 60 * 24);
          const expectedProgress = Math.min(
            Math.max((daysElapsed / totalDays) * 100, 0),
            100,
          );
          const daysRemaining = (end - today.getTime()) / (1000 * 60 * 60 * 24);
          await alertModel.create({
            projectId: pidA,
            workerId: artisanOid,
            alertDate: new Date(),
            expectedProgress: Math.round(expectedProgress * 10) / 10,
            realProgress: 11,
            daysRemaining: Math.round(daysRemaining * 10) / 10,
            status: 'pending',
          });
        }
        console.log('✅ [AHMED] Projet alerte + document alerts');
      }

      // Projets supplémentaires pour mohamed@example.com : 0 % au départ, artisan accepté (test IA photo)
      console.log(
        '\n📝 Ensuring Mohamed artisan projects (0% start, accepted application — IA photo from scratch)...',
      );
      const MOHAMED_IA_TEST_PROJECTS: Array<{
        titre: string;
        description: string;
        budget_estime: number;
      }> = [
        {
          titre: '[MOHAMED IA TEST] Chantier neuf – gros œuvre',
          description:
            'Démo analyse IA depuis le départ (0 %). Mots-clés: fondations, béton, maçonnerie, structure.',
          budget_estime: 185000,
        },
        {
          titre: '[MOHAMED IA TEST] Rénovation salle de bain',
          description:
            'Second chantier test : carrelage, étanchéité, plomberie. Aucune photo seed — premier envoi = analyse IA.',
          budget_estime: 14200,
        },
        {
          titre: '[MOHAMED IA TEST] Extension terrasse',
          description:
            'Dalle, garde-corps, évacuation eaux. Idéal pour une première photo du chantier vide ou démarré.',
          budget_estime: 28000,
        },
        {
          titre: '[MOHAMED IA TEST] Peinture et finitions salon',
          description:
            'Peinture, plinthes, éclairage. Tester l’estimation de % après une ou plusieurs photos.',
          budget_estime: 9600,
        },
        {
          titre: '[MOHAMED IA TEST] Cloisons et isolation bureau',
          description:
            'Cloisons légères, laine de verre, portes. Chantier intérieur pour comparaison avec gros œuvre.',
          budget_estime: 22100,
        },
      ];

      const projSnapshotMohamed = await projectService.findAll(800);
      const mohamedProjectExists = (title: string) =>
        projSnapshotMohamed.some(
          (p: any) =>
            p.titre === title && String(p.clientId) === String(ahmedId),
        );

      for (const spec of MOHAMED_IA_TEST_PROJECTS) {
        if (mohamedProjectExists(spec.titre)) {
          continue;
        }
        await projectService.create({
          titre: spec.titre,
          description: spec.description,
          date_debut: new Date(Date.now() - 5 * 86400000),
          date_fin_prevue: new Date(Date.now() + 100 * 86400000),
          budget_estime: spec.budget_estime,
          statut: 'En cours',
          avancement_global: 0,
          clientId: ahmedId,
          expertId: expertOid,
          applications: [
            {
              artisanId: artisanOid,
              statut: 'acceptee',
              createdAt: new Date(),
            },
          ],
        });
        console.log(
          `   ✅ [MOHAMED IA] Créé: ${spec.titre} (0 %, artisan accepté)`,
        );
      }

      // Projet unique pour tester vite l’upload photo / IA (avancement initial modéré)
      const IA_QUICK_TITLE = '[DÉMO IA] Test upload photo & avancement';
      const allForIaQuick = await projectService.findAll(800);
      const hasIaQuick = allForIaQuick.some(
        (p: any) =>
          p.titre === IA_QUICK_TITLE && String(p.clientId) === String(ahmedId),
      );
      if (!hasIaQuick) {
        await projectService.create({
          titre: IA_QUICK_TITLE,
          description:
            'Chantier dédié au test du flux suivi photo (analyse IA). Client Ahmed, expert Sara, artisan Mohamed accepté. Avancement de départ 18 %.',
          date_debut: new Date(Date.now() - 20 * 86400000),
          date_fin_prevue: new Date(Date.now() + 60 * 86400000),
          budget_estime: 62000,
          statut: 'En cours',
          avancement_global: 18,
          clientId: ahmedId,
          expertId: expertOid,
          applications: [
            {
              artisanId: artisanOid,
              statut: 'acceptee',
              createdAt: new Date(),
            },
          ],
        });
        console.log(`   ✅ [IA QUICK] Créé: ${IA_QUICK_TITLE}`);
      }
    } else {
      console.log(
        '⚠️  Ahmed / Sara / Mohamed introuvable — lot [AHMED TEST] ignoré.',
      );
    }

    // --- Vitrine : photos, bios, artisans supplémentaires, projets terminés avec avis ---
    console.log(
      '\n📝 Ensuring vitrine (photos, bios, projets [VITRINE] avec avis)...',
    );
    const allUsersV = await userService.findAll(300);
    const byEmail = (e: string) =>
      allUsersV.find(
        (u: any) => (u.email || '').toLowerCase() === e.toLowerCase(),
      );

    const expertVitrineMeta: Record<
      string,
      { avatarUrl: string; bio: string }
    > = {
      'expert.peinture@bmp.tn': {
        avatarUrl:
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
        bio: 'Ingénieur d’études peinture et revêtements — conseils couleur, supports et mise en œuvre chantier.',
      },
      'expert.reno@bmp.tn': {
        avatarUrl:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
        bio: 'Coordination multi-corps d’état : plomberie, électricité, carrelage et finitions.',
      },
      'expert.structure@bmp.tn': {
        avatarUrl:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
        bio: 'Structure, gros œuvre et toiture — sécurisation des plans avant travaux.',
      },
      'expert.off@bmp.tn': {
        avatarUrl:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
        bio: 'Expertise second œuvre (peinture, carrelage) — disponibilité selon charge.',
      },
      'expert.elec@bmp.tn': {
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
        bio: 'Mise aux normes, tableaux et éclairage — rénovation et neuf.',
      },
      'expert.plomberie@bmp.tn': {
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        bio: 'Installations sanitaires et réseaux — dépannage et projets complets.',
      },
      'expert.carrelage@bmp.tn': {
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        bio: 'Pose grand format, salles de bain et pièces à vivre.',
      },
      'sara@example.com': {
        avatarUrl:
          'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80',
        bio: 'Accompagnement technique global — coordination avec clients et équipes terrain.',
      },
    };

    for (const [email, meta] of Object.entries(expertVitrineMeta)) {
      const u = byEmail(email) as any;
      if (u?._id) {
        await userService.update(String(u._id), {
          avatarUrl: meta.avatarUrl,
          bio: meta.bio,
        } as any);
      }
    }

    const vitrineArtisans = [
      {
        prenom: 'Karim',
        nom: 'Ben Ammar',
        email: 'artisan.menuiserie@bmp.tn',
        mot_de_passe: 'password123',
        role: 'artisan' as const,
        telephone: '+216 55 100 200',
        specialite: 'Menuiserie aluminium & bois',
        experience_annees: 12,
        zones_travail: [{ scope: 'tn_all' as const }],
        rating: 4.7,
        isAvailable: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
        bio: 'Atelier sur mesure : portes, fenêtres, dressings et agencement intérieur.',
      },
      {
        prenom: 'Salma',
        nom: 'Jlassi',
        email: 'artisan.carrelage@bmp.tn',
        mot_de_passe: 'password123',
        role: 'artisan' as const,
        telephone: '+216 55 200 300',
        specialite: 'Carrelage & faïence',
        experience_annees: 9,
        zones_travail: [{ scope: 'tn_city' as const, value: 'Tunis' }],
        rating: 4.9,
        isAvailable: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
        bio: 'Grands formats, salles de bain et extérieurs — finitions soignées.',
      },
      {
        prenom: 'Walid',
        nom: 'Mabrouk',
        email: 'artisan.elec@bmp.tn',
        mot_de_passe: 'password123',
        role: 'artisan' as const,
        telephone: '+216 55 300 400',
        specialite: 'Électricité bâtiment',
        experience_annees: 11,
        zones_travail: [{ scope: 'tn_all' as const }],
        rating: 4.5,
        isAvailable: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1504257434649-3a7fd3f84f4b?w=400&q=80',
        bio: 'Courant fort/faible, domotique légère, mise aux normes après rénovation.',
      },
      {
        prenom: 'Houda',
        nom: 'Sassi',
        email: 'artisan.peinture@bmp.tn',
        mot_de_passe: 'password123',
        role: 'artisan' as const,
        telephone: '+216 55 400 500',
        specialite: 'Peinture & enduits décoratifs',
        experience_annees: 8,
        zones_travail: [
          { scope: 'tn_city' as const, value: 'Sfax' },
          { scope: 'tn_city' as const, value: 'Sousse' },
        ],
        rating: 4.6,
        isAvailable: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
        bio: 'Peinture intérieure/extérieure et effets décoratifs pour particuliers et bureaux.',
      },
    ];

    for (const a of vitrineArtisans) {
      const ex = await userService.findByEmail(a.email);
      if (!ex) {
        await userService.create(a as any);
        console.log(`   ✅ Artisan vitrine créé: ${a.email}`);
      } else {
        await userService.update((ex as any)._id.toString(), {
          avatarUrl: a.avatarUrl,
          bio: a.bio,
          specialite: a.specialite,
          rating: a.rating,
          experience_annees: a.experience_annees,
          zones_travail: a.zones_travail,
        } as any);
      }
    }

    const mohamedArt = byEmail('mohamed@example.com') as any;
    if (mohamedArt?._id) {
      await userService.update(String(mohamedArt._id), {
        avatarUrl:
          'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
        bio: 'Maçonnerie traditionnelle et rénovation structurelle — équipes stables sur longs chantiers.',
      } as any);
    }

    const allUsersFresh = await userService.findAll(400);
    const userByEmail = (e: string) =>
      allUsersFresh.find(
        (u: any) => (u.email || '').toLowerCase() === e.toLowerCase(),
      );

    const clientV = userByEmail('ahmed@example.com') || client;
    const projVitrine = await projectService.findAll(800);
    const hasVitrineTitle = (t: string) =>
      projVitrine.some((p: any) => p.titre === t);

    const vitrineProjectSpecs: Array<{
      titre: string;
      description: string;
      expertEmail: string;
      artisanEmail: string;
      clientComment: string;
      clientRating: number;
      expertRating: number;
      artisanRating: number;
    }> = [
      {
        titre: '[VITRINE] Rénovation villa — La Marsa',
        description:
          'Rénovation complète : isolation, électricité, cuisine ouverte et terrasse.',
        expertEmail: 'expert.reno@bmp.tn',
        artisanEmail: 'artisan.menuiserie@bmp.tn',
        clientComment:
          'Équipe réactive, planning tenu, finitions au-delà de nos attentes. Je recommande BMP.tn.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Extension R+1 — Ariana',
        description:
          'Surélévation d’un étage, renforcement structure et couverture.',
        expertEmail: 'expert.structure@bmp.tn',
        artisanEmail: 'mohamed@example.com',
        clientComment:
          'Très bon suivi technique. Chantier propre malgré la complexité.',
        clientRating: 5,
        expertRating: 4,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Cuisine équipée — Lac 2',
        description:
          'Démolition, réseaux, carrelage et pose cuisine sur mesure.',
        expertEmail: 'expert.carrelage@bmp.tn',
        artisanEmail: 'artisan.carrelage@bmp.tn',
        clientComment:
          'Carrelage impeccable, délais respectés. Communication claire avec l’experte.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Peinture bureaux — Centre-ville',
        description:
          'Mise en peinture de 400 m² open space, week-ends uniquement.',
        expertEmail: 'expert.peinture@bmp.tn',
        artisanEmail: 'artisan.peinture@bmp.tn',
        clientComment:
          'Intervention rapide sans perturber l’activité. Rendu uniforme.',
        clientRating: 4,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Réfection toiture — Ben Arous',
        description: 'Étanchéité, liteaux et tuiles — dépose partielle.',
        expertEmail: 'expert.structure@bmp.tn',
        artisanEmail: 'mohamed@example.com',
        clientComment:
          'Devis transparent, pas de mauvaise surprise. Bonne coordination.',
        clientRating: 5,
        expertRating: 4,
        artisanRating: 4,
      },
      {
        titre: '[VITRINE] Salle de bain PMR — Mutuelleville',
        description:
          'Adaptation PMR, douche à l’italienne, barres et carrelage antidérapant.',
        expertEmail: 'expert.plomberie@bmp.tn',
        artisanEmail: 'artisan.carrelage@bmp.tn',
        clientComment:
          'Travail soigné pour un usage quotidien en toute sécurité. Merci.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Tableaux électriques — Immeuble',
        description:
          'Mise aux normes des tableaux, terre et différentiels par logement.',
        expertEmail: 'expert.elec@bmp.tn',
        artisanEmail: 'artisan.elec@bmp.tn',
        clientComment:
          'Installations propres, dossier conforme pour la réception.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Terrasse bois — Hammamet',
        description: 'Structure bois exotique, drainage et garde-corps inox.',
        expertEmail: 'expert.reno@bmp.tn',
        artisanEmail: 'artisan.menuiserie@bmp.tn',
        clientComment:
          'Superbe rendu pour l’été. L’équipe a été à l’écoute du détail.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 4,
      },
      {
        titre: '[VITRINE] Cloisons & faux plafonds — Bureau',
        description:
          'Cloisons acoustiques, faux plafonds suspendus et éclairage LED.',
        expertEmail: 'sara@example.com',
        artisanEmail: 'artisan.peinture@bmp.tn',
        clientComment:
          'Bon niveau de finition pour nos réunions et open space.',
        clientRating: 4,
        expertRating: 5,
        artisanRating: 4,
      },
      {
        titre: '[VITRINE] Ravalement façade — Sousse',
        description:
          'Nettoyage, fissures, enduit et peinture façade sur 3 niveaux.',
        expertEmail: 'expert.peinture@bmp.tn',
        artisanEmail: 'artisan.peinture@bmp.tn',
        clientComment: 'Façade comme neuve. Échafaudage géré sans incident.',
        clientRating: 5,
        expertRating: 4,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Piscine & local technique — Gammarth',
        description:
          'Dalle, équipement filtration, carrelage margelles et local technique.',
        expertEmail: 'expert.carrelage@bmp.tn',
        artisanEmail: 'artisan.carrelage@bmp.tn',
        clientComment:
          'Super travail sur les pentes et l’étanchéité. Très satisfaits.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Rénovation loft — Tunis',
        description: 'Ouverture des volumes, IPN, verrière et chape fluide.',
        expertEmail: 'expert.structure@bmp.tn',
        artisanEmail: 'mohamed@example.com',
        clientComment:
          'Projet ambitieux mené avec pédagogie. Résultat magnifique.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Éclairage commerce — Avenue Habib Bourguiba',
        description:
          'Spots, néons LED et mise à la terre pour vitrine et réserve.',
        expertEmail: 'expert.elec@bmp.tn',
        artisanEmail: 'artisan.elec@bmp.tn',
        clientComment:
          'Ouverture dans les temps, éclairage conforme aux normes commerce.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Jardin & clôture — Radès',
        description:
          'Muret, portail coulissant, allée gravillons et éclairage extérieur.',
        expertEmail: 'expert.reno@bmp.tn',
        artisanEmail: 'artisan.menuiserie@bmp.tn',
        clientComment:
          'Extérieur fonctionnel et esthétique. Merci pour le suivi BMP.',
        clientRating: 5,
        expertRating: 4,
        artisanRating: 5,
      },
      {
        titre: '[VITRINE] Réfection plomberie — Appartement',
        description: 'Remplacement colonnes montantes, salle d’eau et cuisine.',
        expertEmail: 'expert.plomberie@bmp.tn',
        artisanEmail: 'artisan.carrelage@bmp.tn',
        clientComment:
          'Intervention propre, moins de poussière que prévu. Bravo.',
        clientRating: 5,
        expertRating: 5,
        artisanRating: 4,
      },
    ];

    /** Galeries « avant / après » pour la vitrine (URLs publiques — 4 + 4 par projet). */
    const vitrinePhotosAvantPool = [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=85',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=85',
      'https://images.unsplash.com/photo-1507089947368-19c925da9775?w=1400&q=85',
      'https://images.unsplash.com/photo-1523413651479-59755e0c44ad?w=1400&q=85',
      'https://images.unsplash.com/photo-1497366210438-12e768c8e85c?w=1400&q=85',
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1400&q=85',
      'https://images.unsplash.com/photo-1502005229762-cf1b6da7c5b6?w=1400&q=85',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=85',
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c6?w=1400&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=85',
      'https://images.unsplash.com/photo-1600585152911-dfcbec067cea?w=1400&q=85',
      'https://images.unsplash.com/photo-1600573472556-e636f53eab27?w=1400&q=85',
    ];
    const vitrinePhotosApresPool = [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=85',
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1400&q=85',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1400&q=85',
      'https://images.unsplash.com/photo-1600566753082-2f6ca09b6a58?w=1400&q=85',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1400&q=85',
      'https://images.unsplash.com/photo-1600047509807-bafc19b8889e?w=1400&q=85',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=85',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1400&q=85',
      'https://images.unsplash.com/photo-1600573472592-701b2c0100c7?w=1400&q=85',
    ];

    const vitrineExpertComments = [
      'Visites de contrôle régulières, validation des lots et arbitrages techniques clairs avec le client.',
      'Dossier technique solide, coordination avec le bureau de contrôle sans friction.',
      'Points d’attention sécurité et conformité bien expliqués sur le terrain.',
      'Rapports de visite envoyés à temps, ajustements de planning proposés au bon moment.',
      'Excellente lecture des plans d’exécution et des réserves avant réception.',
      'Accompagnement sur les choix matériaux et détails de finition.',
      'Synthèse claire entre attentes client et faisabilité chantier.',
      'Gestion des aléas météo et replanification transparente.',
      'Contrôle des réseaux et mise à la terre vérifiée avant fermeture des cloisons.',
      'Réunion de synthèse en fin de phase gros œuvre très utile.',
      'Présence sur levée de réserves structurée et constructive.',
      'Veille aux détails d’étanchéité et points singuliers toiture.',
      'Validation des essais de mise en service électrique.',
      'Suivi des finitions et harmonisation des teintes avec le client.',
      'Clôture administrative du dossier sans surprise.',
    ];
    const vitrineArtisanComments = [
      'Équipe présente chaque jour, chantier rangé, respect des délais annoncés.',
      'Échanges fluides avec le client pour les petits ajustements de dernière minute.',
      'Qualité de pose irréprochable, protections des zones finies systématiques.',
      'Respect du voisinage (horaires, propreté des accès).',
      'Matériaux conformes au devis, factures et garanties fournies.',
      'Sous-traitants coordonnés sans retard sur notre partie.',
      'Finitions soignées, retouches demandées traitées dans la foulée.',
      'Sécurité du chantier exemplaire (EPI, balisage).',
      'Réactivité en cas de besoin d’échantillons supplémentaires.',
      'Respect du planning malgré une contrainte fournisseur en milieu de chantier.',
      'Propreté en fin de journée, benne et gravats gérés proprement.',
      'Derniers détails réglés avant réception sans stress.',
      'Conseils pratiques pour l’entretien après livraison.',
      'Disponibilité pour une petite intervention de garantie mineure.',
      'Équipe sympathique et professionnelle du début à la fin.',
    ];
    const vitrineShowcaseReviewsPool: Array<{
      text: string;
      rating: number;
      author: string;
      role: 'visiteur';
    }> = [
      {
        text: 'Nous sommes passés voir le chantier à mi-parcours : impressionnant niveau de propreté.',
        rating: 5,
        author: 'Samir K.',
        role: 'visiteur',
      },
      {
        text: 'Le rendu final correspond exactement aux photos partagies sur BMP.tn.',
        rating: 5,
        author: 'Inès M.',
        role: 'visiteur',
      },
      {
        text: 'Bon rapport qualité / délais pour un projet de cette ampleur.',
        rating: 4,
        author: 'Hedi B.',
        role: 'visiteur',
      },
      {
        text: 'Voisins du chantier : peu de nuisances sonores, équipe respectueuse.',
        rating: 5,
        author: 'Voisinage — Rue du Lac',
        role: 'visiteur',
      },
      {
        text: 'Visite de réception ouverte : les finitions sont au rendez-vous.',
        rating: 5,
        author: 'Amel R.',
        role: 'visiteur',
      },
      {
        text: 'J’ai recommandé BMP.tn à un collègue après cette réalisation.',
        rating: 5,
        author: 'Youssef T.',
        role: 'visiteur',
      },
      {
        text: 'Communication claire sur les étapes, même pour un non-professionnel.',
        rating: 4,
        author: 'Salma L.',
        role: 'visiteur',
      },
      {
        text: 'Photos du chantier sur la plateforme : très rassurant pour suivre l’avancement.',
        rating: 5,
        author: 'Mehdi F.',
        role: 'visiteur',
      },
      {
        text: 'Bon équilibre entre conseil expert et écoute du budget.',
        rating: 4,
        author: 'Nadia G.',
        role: 'visiteur',
      },
      {
        text: 'Livraison dans les temps annoncés, sans mauvaise surprise.',
        rating: 5,
        author: 'Karim D.',
        role: 'visiteur',
      },
      {
        text: 'Espace lumineux et agréable après travaux, merci à toute l’équipe.',
        rating: 5,
        author: 'Leïla H.',
        role: 'visiteur',
      },
      {
        text: 'Contrôle des détails au sol et aux angles : rien à redire.',
        rating: 5,
        author: 'Omar S.',
        role: 'visiteur',
      },
      {
        text: 'Projet de référence pour notre futur extension.',
        rating: 5,
        author: 'Famille J.',
        role: 'visiteur',
      },
      {
        text: 'Réactivité quand on a demandé une petite modification de dernière minute.',
        rating: 4,
        author: 'Rim A.',
        role: 'visiteur',
      },
      {
        text: 'Très satisfaits, nous avons pris des photos pour notre album perso.',
        rating: 5,
        author: 'Client anonyme',
        role: 'visiteur',
      },
    ];
    const vitrineChantierPhotoPool = [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=85',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=85',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85',
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=85',
      'https://images.unsplash.com/photo-1595846519844-68b4e6b7b0b0?w=1200&q=85',
      'https://images.unsplash.com/photo-1513467534839-fbcff8975ad1?w=1200&q=85',
    ];

    const vitrineEnrichment = (vi: number) => {
      const na = vitrinePhotosAvantPool.length;
      const np = vitrinePhotosApresPool.length;
      const pr = vitrineShowcaseReviewsPool.length;
      return {
        photosAvant: [
          vitrinePhotosAvantPool[vi % na],
          vitrinePhotosAvantPool[(vi + 2) % na],
          vitrinePhotosAvantPool[(vi + 5) % na],
          vitrinePhotosAvantPool[(vi + 8) % na],
        ],
        photosApres: [
          vitrinePhotosApresPool[vi % np],
          vitrinePhotosApresPool[(vi + 3) % np],
          vitrinePhotosApresPool[(vi + 6) % np],
          vitrinePhotosApresPool[(vi + 9) % np],
        ],
        expertComment: vitrineExpertComments[vi % vitrineExpertComments.length],
        artisanComment:
          vitrineArtisanComments[vi % vitrineArtisanComments.length],
        showcaseReviews: [
          vitrineShowcaseReviewsPool[(vi * 3) % pr],
          vitrineShowcaseReviewsPool[(vi * 3 + 1) % pr],
          vitrineShowcaseReviewsPool[(vi * 3 + 2) % pr],
        ],
      };
    };

    if (clientV?._id) {
      const cid = new Types.ObjectId(clientV._id);
      let createdV = 0;
      for (let vi = 0; vi < vitrineProjectSpecs.length; vi++) {
        const spec = vitrineProjectSpecs[vi];
        if (hasVitrineTitle(spec.titre)) continue;
        const exp = userByEmail(spec.expertEmail) as any;
        const art = userByEmail(spec.artisanEmail) as any;
        if (!exp?._id || !art?._id) continue;
        const enr = vitrineEnrichment(vi);
        await projectService.create({
          titre: spec.titre,
          description: spec.description,
          date_debut: new Date('2023-04-01'),
          date_fin_prevue: new Date('2024-06-30'),
          budget_estime: 45000 + Math.floor(Math.random() * 80000),
          statut: 'Terminé',
          avancement_global: 100,
          clientId: cid,
          expertId: new Types.ObjectId(exp._id as string),
          applications: [
            {
              artisanId: new Types.ObjectId(art._id as string),
              statut: 'acceptee',
              createdAt: new Date('2023-05-01'),
            },
          ],
          clientRating: spec.clientRating,
          clientComment: spec.clientComment,
          expertRating: spec.expertRating,
          artisanRating: spec.artisanRating,
          photosAvant: enr.photosAvant,
          photosApres: enr.photosApres,
          expertComment: enr.expertComment,
          artisanComment: enr.artisanComment,
          showcaseReviews: enr.showcaseReviews,
        } as any);
        createdV++;
      }
      console.log(
        `   ✅ Projets vitrine [VITRINE] : ${createdV} créé(s) (${vitrineProjectSpecs.length} spécifications au total)`,
      );

      const allProjForPhotos = await projectService.findAll(800);
      let updatedVitrine = 0;
      for (let vi = 0; vi < vitrineProjectSpecs.length; vi++) {
        const spec = vitrineProjectSpecs[vi];
        const p = allProjForPhotos.find((x: any) => x.titre === spec.titre) as
          | { _id?: { toString(): string }; titre?: string }
          | undefined;
        if (!p?._id) continue;
        const enr = vitrineEnrichment(vi);
        await projectService.update(String(p._id), {
          photosAvant: enr.photosAvant,
          photosApres: enr.photosApres,
          expertComment: enr.expertComment,
          artisanComment: enr.artisanComment,
          showcaseReviews: enr.showcaseReviews,
        } as any);
        updatedVitrine++;
      }
      if (updatedVitrine > 0) {
        console.log(
          `   ✅ Vitrine : photos, commentaires expert/artisan et avis invités synchronisés pour ${updatedVitrine} projet(s) [VITRINE]`,
        );
      }

      const allVitrineForSuivi = await projectService.findAll(800);
      let vitrineSuivis = 0;
      for (let vi = 0; vi < vitrineProjectSpecs.length; vi++) {
        const spec = vitrineProjectSpecs[vi];
        const proj = allVitrineForSuivi.find(
          (x: any) => x.titre === spec.titre,
        ) as { _id?: Types.ObjectId } | undefined;
        if (!proj?._id) continue;
        const pid = new Types.ObjectId(String(proj._id));
        const n = await suiviProjectModel.countDocuments({
          projectId: pid,
          description_progression: /^\[VITRINE chantier\]/,
        });
        if (n >= 3) continue;
        const dates = [
          new Date('2023-07-10'),
          new Date('2023-10-15'),
          new Date('2024-01-20'),
        ];
        const pcts = [35, 72, 100];
        const descs = [
          '[VITRINE chantier] Phase démarrage — lots ouverts, contrôles et premières finitions visibles.',
          '[VITRINE chantier] Mi-chantier — avancement conforme, coordination expert / artisan.',
          '[VITRINE chantier] Livraison — réception, derniers réglages et chantier nettoyé.',
        ];
        for (let si = 0; si < 3; si++) {
          await suiviProjectService.create({
            projectId: pid,
            date_suivi: dates[si],
            description_progression: descs[si],
            pourcentage_avancement: pcts[si],
            cout_actuel: 22000 + vi * 800 + si * 4500,
            photoUrl:
              vitrineChantierPhotoPool[
                (vi + si) % vitrineChantierPhotoPool.length
              ],
          } as any);
        }
        vitrineSuivis++;
      }
      if (vitrineSuivis > 0) {
        console.log(
          `   ✅ Suivi chantier (photos) ajouté pour ${vitrineSuivis} projet(s) vitrine`,
        );
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Test Data Summary:');
    const finalUsers = await userService.findAll();
    const finalProjects = await projectService.findAll();
    const finalSuivis = await suiviProjectService.findAll();
    const finalDevis = await devisService.findAll();
    const finalProduits = await marketplaceService.findAllProduits();
    const finalCommandes = await marketplaceService.findAllCommandes();
    const finalAlerts = await alertModel.countDocuments();

    console.log(
      `   👥 Users: ${finalUsers.length} (${finalUsers.filter((u) => u.role === 'client').length} clients, ${finalUsers.filter((u) => u.role === 'expert').length} experts, ${finalUsers.filter((u) => u.role === 'artisan').length} artisans)`,
    );
    console.log(`   🏗️  Projects: ${finalProjects.length}`);
    console.log(`   📈 Project Follow-ups: ${finalSuivis.length}`);
    console.log(`   🚨 Alerts (STEP 2): ${finalAlerts}`);
    console.log(`   💰 Quotes: ${finalDevis.length}`);
    console.log(`   🛒 Products: ${finalProduits.length}`);
    console.log(`   📦 Orders: ${finalCommandes.length}`);
    console.log('\n✨ Your database is ready for testing!');
    console.log(
      '\n   📌 Démo alerte retard: titre « Projet démo – Alerte retard (échéance critique) » — avancement 12 % (voir aussi collection `alerts`).',
    );
    console.log(
      '\n   🔑 Client test: ahmed@example.com / password123 — projets « [AHMED TEST] … » (suivi, matching, alerte).',
    );

    console.log('\n' + '='.repeat(72));
    console.log(
      '🔐 COMPTES DE TEST BMP.tn — mot de passe par défaut: password123 (admin: admin123)',
    );
    console.log('='.repeat(72));
    const accountLines: Array<{ role: string; email: string; pass: string; note: string }> = [
      {
        role: 'client',
        email: 'ahmed@example.com',
        pass: 'password123',
        note: 'Espace client, suivi, [AHMED TEST], [MOHAMED IA TEST], [DÉMO IA]',
      },
      {
        role: 'client',
        email: 'leila@example.com',
        pass: 'password123',
        note: 'Client démo secondaire',
      },
      {
        role: 'client',
        email: 'omar@example.com',
        pass: 'password123',
        note: 'Client démo tertiaire',
      },
      {
        role: 'expert',
        email: 'sara@example.com',
        pass: 'password123',
        note: 'Expert principal démo — suivi photo, dossiers Ahmed',
      },
      {
        role: 'artisan',
        email: 'mohamed@example.com',
        pass: 'password123',
        note: 'Gestion chantier / upload photo IA (projets acceptés)',
      },
      {
        role: 'manufacturer',
        email: 'fatma@example.com',
        pass: 'password123',
        note: 'Fournisseur marketplace',
      },
      {
        role: 'admin',
        email: 'admin@bmp.tn',
        pass: 'admin123',
        note: 'Admin — matching, notifications, alertes',
      },
    ];
    for (const a of accountLines) {
      console.log(
        `   • [${a.role.padEnd(12)}] ${a.email.padEnd(28)} / ${a.pass.padEnd(12)} — ${a.note}`,
      );
    }
    console.log(
      '   • [expert       ] expert.peinture@bmp.tn … expert.carrelage@bmp.tn / password123 — experts matching (8 comptes)',
    );
    console.log(
      '   • [artisan      ] artisan.menuiserie@bmp.tn (+ autres @bmp.tn) / password123 — vitrine',
    );
    console.log(
      '\n   📷 Test analyse photo IA (Next.js): connectez-vous expert (sara@…) ou artisan (mohamed@…),',
    );
    console.log(
      '      ouvrez un projet assigné → suivi photo / gestion chantier. Clé ANTHROPIC_API_KEY requise pour Claude.',
    );
    console.log('='.repeat(72));
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed();
