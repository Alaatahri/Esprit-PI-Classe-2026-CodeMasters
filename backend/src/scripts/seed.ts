import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { ProjectService } from '../project/project.service';
import { SuiviProjectService } from '../suivi-project/suivi-project.service';
import { DevisService } from '../devis/devis.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { Types } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  const projectService = app.get(ProjectService);
  const suiviProjectService = app.get(SuiviProjectService);
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
        nom: 'Sara Trabelsi',
        email: 'sara@example.com',
        mot_de_passe: 'password123',
        role: 'expert',
        telephone: '+216 98 765 432',
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

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Test Data Summary:');
    const finalUsers = await userService.findAll();
    const finalProjects = await projectService.findAll();
    const finalSuivis = await suiviProjectService.findAll();
    const finalDevis = await devisService.findAll();
    const finalProduits = await marketplaceService.findAllProduits();
    const finalCommandes = await marketplaceService.findAllCommandes();
    
    console.log(`   👥 Users: ${finalUsers.length} (${finalUsers.filter(u => u.role === 'client').length} clients, ${finalUsers.filter(u => u.role === 'expert').length} experts, ${finalUsers.filter(u => u.role === 'artisan').length} artisans)`);
    console.log(`   🏗️  Projects: ${finalProjects.length}`);
    console.log(`   📈 Project Follow-ups: ${finalSuivis.length}`);
    console.log(`   💰 Quotes: ${finalDevis.length}`);
    console.log(`   🛒 Products: ${finalProduits.length}`);
    console.log(`   📦 Orders: ${finalCommandes.length}`);
    console.log('\n✨ Your database is ready for testing!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed();
