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
      const clients = existingUsers.filter(u => u.role === 'client');
      client = clients[0] || existingUsers[0];
      client2 = clients[1];
      client3 = clients[2];
      expert = existingUsers.find(u => u.role === 'expert') || existingUsers[0];
      artisan =
        existingUsers.find(u => u.email === 'mohamed@example.com') ||
        existingUsers.find(u => u.role === 'artisan');
      manufacturer = existingUsers.find(u => u.role === 'manufacturer');
      admin = existingUsers.find(u => u.role === 'admin');
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
        await userService.update((existing as any)._id?.toString?.() ?? (existing as any)._id, {
          prenom: (ex as any).prenom,
          nom: (ex as any).nom,
          competences: (ex as any).competences,
          isAvailable: (ex as any).isAvailable,
          rating: (ex as any).rating,
          experienceYears: (ex as any).experienceYears,
        } as any);
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
        description: 'Construction d\'une villa moderne de 250m² avec jardin et piscine. Projet incluant 4 chambres, salon, cuisine équipée, et terrasse panoramique.',
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
        description: 'Rénovation complète d\'un appartement de 80m² incluant électricité, plomberie, carrelage et peinture.',
        date_debut: new Date('2024-03-01'),
        date_fin_prevue: new Date('2024-06-30'),
        budget_estime: 45000,
        statut: 'En attente',
        avancement_global: 0,
        clientId: new Types.ObjectId(clientForProject2._id),
      });

      const project3 = await projectService.create({
        titre: 'Extension Maison',
        description: 'Extension de 50m² pour une maison existante avec nouvelle chambre et salle de bain.',
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
        description: 'Construction d\'un immeuble de 6 étages avec 12 appartements, parking souterrain et espaces communs.',
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
        description: 'Aménagement complet d\'un espace de bureau de 200m² avec cloisons, éclairage LED et mobilier sur mesure.',
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
            date_debut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
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
        projects.some((p: any) =>
          p?.statut === 'Terminé' &&
          (p?.applications || []).some(
            (a: any) =>
              a?.statut === 'acceptee' &&
              a?.artisanId?.toString?.() === artisanFeedbackTarget._id?.toString?.(),
          ),
        );

      if (!hasCompletedForTarget && client && expert && artisanFeedbackTarget) {
        const artisanFeedbackTitle = `Projet démo – Feedback artisan (terminé) – ${artisanFeedbackTarget.email}`;
        console.log('\n📝 Creating demo completed project with artisan feedback...');
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
      const projectEnCours = projects.find(p => p.statut === 'En cours');
      if (projectEnCours) {
        await suiviProjectService.create({
          projectId: new Types.ObjectId(projectEnCours._id),
          date_suivi: new Date('2024-02-15'),
          description_progression: 'Fondations terminées, début des murs porteurs. Travaux conformes au planning.',
          pourcentage_avancement: 30,
          cout_actuel: 105000,
          photo_url: 'https://example.com/photos/fondations.jpg',
        });

        await suiviProjectService.create({
          projectId: new Types.ObjectId(projectEnCours._id),
          date_suivi: new Date('2024-03-01'),
          description_progression: 'Murs porteurs terminés, début de la charpente. Légère avance sur le planning.',
          pourcentage_avancement: 45,
          cout_actuel: 157500,
        });

        console.log('✅ Project follow-ups created: 2');
      }
    }

    // Données démo supplémentaires (idempotent) — suivi photo STEP 1 + projet pour matching
    console.log('\n📝 Ensuring bonus demo data (suivi photo STEP 1, projet matching)...');
    const DEMO_SUIVI_TITLE = 'Projet démo BMP – Suivi photo (STEP 1)';
    const DEMO_MATCHING_TITLE = 'Projet démo – Matching IA (rénovation cuisine)';

    const allProjList = await projectService.findAll(500);
    let demoSuiviProject = allProjList.find((p: any) => p.titre === DEMO_SUIVI_TITLE);
    let demoMatchingProject = allProjList.find((p: any) => p.titre === DEMO_MATCHING_TITLE);

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
        (demoSuiviProject as any)._id?.toString?.() ?? (demoSuiviProject as any)._id,
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
        console.log('✅ Bonus demo suivis created (STEP 1 fields):', rows.length);
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
    let alertDemoProject = projListForAlert.find((p: any) => p.titre === ALERT_DEMO_TITLE);

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
        console.log('✅ Demo alert project created (avancement 12 %, fin dans ~2 j)');

        const pid = new Types.ObjectId(
          (alertDemoProject as any)._id?.toString?.() ?? (alertDemoProject as any)._id,
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
          (new Date(alertDemoProject.date_fin_prevue).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24);

        const existingAlert = await alertModel.countDocuments({ projectId: pid });
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
          console.log('✅ Demo alert document created in collection `alerts` (STEP 2)');
        }
      } else {
        const pid = new Types.ObjectId(
          (alertDemoProject as any)._id?.toString?.() ?? (alertDemoProject as any)._id,
        );
        const wid = new Types.ObjectId(artisan._id);
        const existingAlert = await alertModel.countDocuments({ projectId: pid });
        if (existingAlert === 0) {
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
            (new Date(alertDemoProject.date_fin_prevue).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24);
          await alertModel.create({
            projectId: pid,
            workerId: wid,
            alertDate: new Date(),
            expectedProgress: Math.round(expectedProgress * 10) / 10,
            realProgress: typeof alertDemoProject.avancement_global === 'number'
              ? alertDemoProject.avancement_global
              : 12,
            daysRemaining: Math.round(daysRemaining * 10) / 10,
            status: 'pending',
          });
          console.log('✅ Demo alert document created in collection `alerts` (STEP 2)');
        }
      }
    }

    // Créer des devis
    console.log('\n📝 Creating quotes (devis)...');
    const existingDevis = await devisService.findAll();
    
    if (existingDevis.length === 0 && projects.length > 0) {
      const project1 = projects[0];
      const devis1 = await devisService.create({
        projectId: new Types.ObjectId(project1._id),
        clientId: new Types.ObjectId(client._id),
        expertId: new Types.ObjectId(expert._id),
        montant_total: 0,
        statut: 'En attente',
        date_creation: new Date('2024-01-10'),
      });

      // Ajouter des items au devis
      await devisService.createItem({
        devisId: new Types.ObjectId((devis1 as any)._id),
        description: 'Travaux de terrassement et fondations',
        quantite: 1,
        prix_unitaire: 45000,
      });

      await devisService.createItem({
        devisId: new Types.ObjectId((devis1 as any)._id),
        description: 'Maçonnerie et structure',
        quantite: 1,
        prix_unitaire: 120000,
      });

      await devisService.createItem({
        devisId: new Types.ObjectId((devis1 as any)._id),
        description: 'Charpente et couverture',
        quantite: 1,
        prix_unitaire: 85000,
      });

      console.log('✅ Quotes created: 1 with 3 items');
    }

    // Créer des produits marketplace
    console.log('\n📝 Creating marketplace products...');
    const existingProduits = await marketplaceService.findAllProduits();
    
    if (existingProduits.length === 0 && manufacturer) {
      const produit1 = await marketplaceService.createProduit({
        nom: 'Ciment Portland CPJ45',
        description: 'Ciment de qualité supérieure pour tous types de travaux de construction',
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

      const produit3 = await marketplaceService.createProduit({
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
    console.log('\n📝 Ensuring Ahmed bundle (ahmed@example.com / password123)...');
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
      const MOHAMED_IA_TEST_PROJECTS: Array<{ titre: string; description: string; budget_estime: number }> = [
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
        console.log(`   ✅ [MOHAMED IA] Créé: ${spec.titre} (0 %, artisan accepté)`);
      }
    } else {
      console.log('⚠️  Ahmed / Sara / Mohamed introuvable — lot [AHMED TEST] ignoré.');
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

    console.log(`   👥 Users: ${finalUsers.length} (${finalUsers.filter(u => u.role === 'client').length} clients, ${finalUsers.filter(u => u.role === 'expert').length} experts, ${finalUsers.filter(u => u.role === 'artisan').length} artisans)`);
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
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed();
