# BMP.tn - Digital Marketplace & Management Platform

Plateforme digitale complète pour le secteur de la construction connectant Experts, Artisans et Fabricants.

## 🏗️ Architecture du Projet

### Frontend (React)
- **Technologie**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Structure**:
  ```
  backend-react/
  ├── src/
  │   ├── components/     # Composants réutilisables
  │   ├── pages/          # Pages de l'application
  │   ├── services/        # Services API (Axios)
  │   ├── layouts/         # Layouts et navigation
  │   └── App.tsx          # Point d'entrée
  ```

### Backend (NestJS)
- **Technologie**: NestJS + TypeScript
- **Base de données**: MongoDB avec Mongoose
- **Structure**:
  ```
  backend/
  ├── src/
  │   ├── user/            # Module Utilisateurs
  │   ├── project/         # Module Projets
  │   ├── suivi-project/   # Module Suivi de Projets
  │   ├── devis/           # Module Devis
  │   └── marketplace/     # Module Marketplace
  ```

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- MongoDB (v6 ou supérieur)
- npm ou yarn

## 🚀 Installation

### 1. Installation des dépendances Frontend

```bash
cd backend-react
npm install
```

### 2. Installation des dépendances Backend

```bash
cd backend
npm install
```

### 3. Configuration MongoDB

Assurez-vous que MongoDB est en cours d'exécution sur `localhost:27017`.

La base de données sera créée automatiquement : `bmp-tn`

## 🏃 Démarrage

### Démarrer le Backend

```bash
cd backend
npm run start:dev
```

Le serveur backend sera accessible sur : `http://localhost:3001`

### Démarrer le Frontend

```bash
cd backend-react
npm run dev
```

L'application frontend sera accessible sur : `http://localhost:3000`

## 📊 Structure de la Base de Données

### 1. User Collection
- `nom` (string)
- `email` (string, unique)
- `mot_de_passe` (string)
- `role` (client | expert | artisan | manufacturer | admin)
- `telephone` (string)
- `createdAt` (Date)

### 2. Project Collection
- `titre` (string)
- `description` (string)
- `date_debut` (Date)
- `date_fin_prevue` (Date)
- `budget_estime` (number)
- `statut` (En attente | En cours | Terminé)
- `avancement_global` (number 0-100)
- `clientId` (ObjectId ref User)
- `expertId` (ObjectId ref User)
- `createdAt` (Date)

### 3. SuiviProject Collection
- `projectId` (ObjectId ref Project)
- `date_suivi` (Date)
- `description_progression` (string)
- `pourcentage_avancement` (number)
- `cout_actuel` (number)
- `photo_url` (string)

**Logique automatique** : Lors de l'ajout d'un SuiviProject, le système met automatiquement à jour :
- `Project.avancement_global`
- `Project.statut` :
  - 0% → "En attente"
  - 1-99% → "En cours"
  - 100% → "Terminé"

### 4. Devis Collection
- `projectId` (ObjectId ref Project)
- `clientId` (ObjectId ref User)
- `expertId` (ObjectId ref User)
- `montant_total` (number)
- `statut` (En attente | Accepté | Refusé)
- `date_creation` (Date)

### 5. DevisItem Collection
- `devisId` (ObjectId ref Devis)
- `description` (string)
- `quantite` (number)
- `prix_unitaire` (number)

### 6. Produit Collection (Marketplace)
- `nom` (string)
- `description` (string)
- `prix` (number)
- `stock` (number)
- `image_url` (string)
- `vendeurId` (ObjectId ref User)

### 7. Commande Collection
- `clientId` (ObjectId ref User)
- `montant_total` (number)
- `statut` (En attente | Payée | Livrée)
- `date_commande` (Date)

### 8. CommandeItem Collection
- `commandeId` (ObjectId ref Commande)
- `produitId` (ObjectId ref Produit)
- `quantite` (number)
- `prix` (number)

## 🔌 API Endpoints

### Users
- `GET /api/users` - Liste tous les utilisateurs
- `GET /api/users/:id` - Détails d'un utilisateur
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Mettre à jour un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Projects
- `GET /api/projects` - Liste tous les projets
- `GET /api/projects/:id` - Détails d'un projet
- `POST /api/projects` - Créer un projet
- `PUT /api/projects/:id` - Mettre à jour un projet
- `DELETE /api/projects/:id` - Supprimer un projet

### Suivi Projects
- `GET /api/suivi-projects` - Liste tous les suivis
- `GET /api/suivi-projects?projectId=xxx` - Suivis d'un projet
- `GET /api/suivi-projects/:id` - Détails d'un suivi
- `POST /api/suivi-projects` - Créer un suivi (met à jour automatiquement le projet)
- `PUT /api/suivi-projects/:id` - Mettre à jour un suivi
- `DELETE /api/suivi-projects/:id` - Supprimer un suivi

### Devis
- `GET /api/devis` - Liste tous les devis
- `GET /api/devis?projectId=xxx` - Devis d'un projet
- `GET /api/devis/:id` - Détails d'un devis
- `POST /api/devis` - Créer un devis
- `PUT /api/devis/:id` - Mettre à jour un devis
- `DELETE /api/devis/:id` - Supprimer un devis

### Devis Items
- `POST /api/devis/:id/items` - Ajouter un item à un devis
- `GET /api/devis/:id/items` - Liste les items d'un devis
- `PUT /api/devis/items/:itemId` - Mettre à jour un item
- `DELETE /api/devis/items/:itemId` - Supprimer un item

### Marketplace - Produits
- `GET /api/marketplace/produits` - Liste tous les produits
- `GET /api/marketplace/produits/:id` - Détails d'un produit
- `POST /api/marketplace/produits` - Créer un produit
- `PUT /api/marketplace/produits/:id` - Mettre à jour un produit
- `DELETE /api/marketplace/produits/:id` - Supprimer un produit

### Marketplace - Commandes
- `GET /api/marketplace/commandes` - Liste toutes les commandes
- `GET /api/marketplace/commandes?clientId=xxx` - Commandes d'un client
- `GET /api/marketplace/commandes/:id` - Détails d'une commande
- `POST /api/marketplace/commandes` - Créer une commande
- `PUT /api/marketplace/commandes/:id` - Mettre à jour une commande
- `DELETE /api/marketplace/commandes/:id` - Supprimer une commande

### Marketplace - Commande Items
- `POST /api/marketplace/commandes/:id/items` - Ajouter un item à une commande
- `GET /api/marketplace/commandes/:id/items` - Liste les items d'une commande
- `PUT /api/marketplace/commandes/items/:itemId` - Mettre à jour un item
- `DELETE /api/marketplace/commandes/items/:itemId` - Supprimer un item

## 📝 Notes Importantes

1. **CORS** : Le backend est configuré pour accepter les requêtes depuis `http://localhost:3000`
2. **MongoDB** : Assurez-vous que MongoDB est démarré avant de lancer le backend
3. **Auto-update** : Le module SuiviProject met automatiquement à jour le statut et l'avancement du projet associé
4. **Calculs automatiques** : Les montants totaux des Devis et Commandes sont calculés automatiquement lors de l'ajout/modification d'items

## 🎯 Prochaines Étapes

- Ajouter l'authentification (JWT)
- Implémenter la validation des données
- Ajouter les tests unitaires et d'intégration
- Améliorer l'interface utilisateur
- Ajouter la gestion des fichiers/images
