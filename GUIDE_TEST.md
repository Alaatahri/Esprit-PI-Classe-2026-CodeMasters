# 🧪 Guide de Test - BMP.tn Interface Backend

Ce guide vous explique comment tester l'interface React qui consomme l'API NestJS.

## 📋 Prérequis

1. **MongoDB** doit être démarré sur `localhost:27017`
2. **Node.js** installé (v18+)
3. Les dépendances installées pour le backend et le frontend

## 🚀 Étapes pour Tester

### Étape 1 : Installer les dépendances

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd backend-react
npm install
```

### Étape 2 : Créer des données de test (Optionnel mais recommandé)

Pour avoir des données à afficher dans l'interface, exécutez le script de seed :

```bash
cd backend
npm run seed
```

Ce script créera :
- 3 utilisateurs (1 client, 1 expert, 1 artisan)
- 3 projets (1 En cours, 1 En attente, 1 Terminé)

### Étape 3 : Démarrer le Backend

Dans un terminal, lancez :

```bash
cd backend
npm run start:dev
```

Le serveur backend sera accessible sur : **http://localhost:3001**

Vous devriez voir :
```
🚀 Backend server running on http://localhost:3001
📋 API Base URL: http://localhost:3001/api
```

### Étape 4 : Démarrer le Frontend

Dans un **nouveau terminal**, lancez :

```bash
cd backend-react
npm run dev
```

Le frontend sera accessible sur : **http://localhost:3000**

### Étape 5 : Tester l'Interface

1. **Ouvrez votre navigateur** sur `http://localhost:3000`

2. **Vous verrez le Dashboard** avec :
   - Statistiques (Total Projets, Projets en Cours, etc.)
   - Liste des projets récents
   - Liens vers les différentes pages

3. **Testez les différentes pages** :
   - **Dashboard** (`/`) - Vue d'ensemble
   - **Projets** (`/projects`) - Liste de tous les projets
   - **Ajouter un Projet** (`/projects/add`) - Formulaire de création
   - **Détails d'un Projet** (`/projects/:id`) - Vue détaillée
   - **Utilisateurs** (`/users`) - Liste des utilisateurs

## 🔍 Vérification de la Connexion API

### Test Backend directement

Vous pouvez tester l'API directement dans votre navigateur ou avec curl :

```bash
# Vérifier que le serveur fonctionne
curl http://localhost:3001/api/

# Liste des utilisateurs
curl http://localhost:3001/api/users

# Liste des projets
curl http://localhost:3001/api/projects
```

### Test depuis le Frontend

1. Ouvrez la **Console du navigateur** (F12)
2. Naviguez dans l'interface
3. Les appels API seront visibles dans l'onglet **Network**
4. Vérifiez qu'il n'y a pas d'erreurs CORS ou de connexion

## 🐛 Résolution de Problèmes

### Erreur : "Cannot connect to API"

1. Vérifiez que le backend est démarré sur le port 3001
2. Vérifiez que MongoDB est démarré
3. Vérifiez la console du navigateur pour les erreurs CORS

### Erreur : "MongoDB connection failed"

1. Vérifiez que MongoDB est démarré :
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. Vérifiez la connexion dans `backend/src/app.module.ts`

### Erreur : "Port 3000 already in use"

Changez le port dans `backend-react/vite.config.ts` :
```typescript
server: {
  port: 3001, // Changez le port
}
```

### Pas de données affichées

1. Exécutez le script de seed : `npm run seed` (dans le dossier backend)
2. Vérifiez que MongoDB contient des données
3. Vérifiez la console du navigateur pour les erreurs API

## 📊 Endpoints API Disponibles

### Users
- `GET /api/users` - Liste tous les utilisateurs
- `GET /api/users/:id` - Détails d'un utilisateur
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Mettre à jour
- `DELETE /api/users/:id` - Supprimer

### Projects
- `GET /api/projects` - Liste tous les projets
- `GET /api/projects/:id` - Détails d'un projet
- `POST /api/projects` - Créer un projet
- `PUT /api/projects/:id` - Mettre à jour
- `DELETE /api/projects/:id` - Supprimer

### Suivi Projects
- `GET /api/suivi-projects` - Liste tous les suivis
- `GET /api/suivi-projects?projectId=xxx` - Suivis d'un projet
- `POST /api/suivi-projects` - Créer un suivi

### Devis
- `GET /api/devis` - Liste tous les devis
- `POST /api/devis` - Créer un devis
- `POST /api/devis/:id/items` - Ajouter un item

### Marketplace
- `GET /api/marketplace/produits` - Liste des produits
- `GET /api/marketplace/commandes` - Liste des commandes

## ✅ Checklist de Test

- [ ] Backend démarré sur port 3001
- [ ] Frontend démarré sur port 3000
- [ ] MongoDB connecté
- [ ] Données de test créées (seed)
- [ ] Dashboard affiche les statistiques
- [ ] Liste des projets fonctionne
- [ ] Formulaire d'ajout de projet fonctionne
- [ ] Détails d'un projet s'affichent
- [ ] Liste des utilisateurs fonctionne
- [ ] Pas d'erreurs dans la console du navigateur

## 🎯 Prochaines Étapes

Une fois que tout fonctionne :
1. Testez la création d'un nouveau projet depuis l'interface
2. Testez l'ajout d'un suivi de projet
3. Explorez les autres fonctionnalités (Devis, Marketplace)

Bon test ! 🚀
