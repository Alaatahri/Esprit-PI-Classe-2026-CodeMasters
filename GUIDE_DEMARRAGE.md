# Guide de démarrage – Frontend, Backend et MongoDB

Ce guide vous permet de lancer le frontend, le backend, de voir la base MongoDB et de comprendre les liaisons entre les parties.

---

## Prérequis

- **Node.js** (v18 ou plus) installé
- **MongoDB** installé et démarré en local (ou MongoDB Atlas avec une URI)
- Un terminal (PowerShell ou CMD)

---

## Étape 1 : Démarrer MongoDB

Votre connexion MongoDB : **`mongodb://localhost:27017`**

Le backend se connecte à cette même adresse en utilisant la base **`bmp-tn`** (URI complète : `mongodb://localhost:27017/bmp-tn`). Aucune variable d’environnement à définir pour une installation locale.

### Option A – MongoDB installé en local (Windows)

1. Ouvrez un terminal.
2. Démarrez le service MongoDB (selon votre installation) :
   - Si MongoDB est installé comme service : il est peut‑être déjà démarré.
   - Sinon, lancez :  
     `"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe" --dbpath C:\data\db`  
     (ajustez le chemin et créez `C:\data\db` si besoin).
3. Vérifiez que MongoDB écoute sur le port **27017**.

### Option B – MongoDB Atlas (cloud)

1. Créez un cluster gratuit sur [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Récupérez l’URI de connexion (ex. `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/`).
3. À l’**étape 3**, définissez la variable d’environnement :  
   `MONGODB_URI=votre_uri_ici`  
   avant de lancer le backend.

---

## Étape 2 : Installer les dépendances et lancer le backend

1. Ouvrez un terminal dans le dossier du projet.
2. Allez dans le dossier backend et installez les dépendances :

```bash
cd backend
npm install
```

3. (Optionnel) Si vous utilisez MongoDB Atlas, définissez l’URI :

```powershell
$env:MONGODB_URI="mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/bmp-tn"
```

4. Lancez le backend en mode développement :

```bash
npm run start:dev
```

5. Vérifiez dans la console :
   - `Backend server running on http://localhost:3001`
   - `API Base URL: http://localhost:3001/api`

Le backend NestJS est maintenant connecté à MongoDB (base **`bmp-tn`**).

---

## Étape 3 : Peupler la base (seed) – utilisateurs et données de test

Pour avoir des utilisateurs (dont ceux pour le login) et des projets/devis/marketplace :

1. Dans le même terminal (ou un nouveau), depuis le dossier **`backend`** :

```bash
npm run seed
```

2. Vous devriez voir des messages du type :
   - Création d’utilisateurs (client, expert, artisan, manufacturer, admin)
   - Création de projets, suivis, devis, produits marketplace, commandes

3. Comptes de test pour le **login** :

| Rôle        | Email             | Mot de passe |
|------------|-------------------|--------------|
| Client     | ahmed@example.com | password123  |
| Expert     | sara@example.com | password123  |
| Artisan    | mohamed@example.com | password123 |
| Manufacturer | fatma@example.com | password123 |
| Admin      | admin@bmp.tn      | admin123     |

---

## Étape 4 : Voir la base MongoDB

### Option A – MongoDB Compass (recommandé)

1. Téléchargez [MongoDB Compass](https://www.mongodb.com/products/compass).
2. Connectez-vous avec : `mongodb://localhost:27017`  
   (ou votre URI Atlas si vous l’utilisez).
3. Ouvrez la base **`bmp-tn`**.
4. Collections créées après le seed :
   - **users** – utilisateurs (client, expert, admin, etc.)
   - **projects** – projets (avec `clientId`, `expertId`)
   - **suiviprojects** – suivis de projets (`projectId`)
   - **devis** – devis (`projectId`, `clientId`, `expertId`)
   - **devisitems** – lignes de devis (`devisId`)
   - **produits** – produits marketplace (`vendeurId`)
   - **commandes** – commandes (`clientId`)
   - **commandeitems** – lignes de commande (`commandeId`, `produitId`)

### Option B – Ligne de commande (mongo shell)

```bash
mongosh
use bmp-tn
show collections
db.users.find().pretty()
db.projects.find().pretty()
```

---

## Étape 5 : Lancer le frontend (React)

1. Ouvrez un **nouveau** terminal (gardez le backend qui tourne).
2. Allez à la racine du projet puis dans le frontend :

```bash
cd backend-react
npm install
npm run dev
```

3. Vite affiche en général : **`http://localhost:3000`**.
4. Ouvrez **http://localhost:3000** dans le navigateur.
5. Vous êtes redirigé vers **http://localhost:3000/login**.
6. Connectez-vous avec un des comptes du tableau (étape 3), par exemple :
   - **admin@bmp.tn** / **admin123**
   - ou **ahmed@example.com** / **password123**

Après connexion, vous devez arriver sur le tableau de bord.

---

## Liaisons (résumé)

```
┌─────────────────┐     HTTP (localhost:3001/api)     ┌─────────────────┐
│   Frontend      │  ◄────────────────────────────►  │   Backend       │
│   React (Vite)  │   axios baseURL: 3001/api        │   NestJS        │
│   localhost:3000│                                  │   localhost:3001 │
└─────────────────┘                                  └────────┬────────┘
                                                              │
                                                              │ Mongoose
                                                              │ MONGODB_URI
                                                              ▼
                                                     ┌─────────────────┐
                                                     │   MongoDB       │
                                                     │   Base: bmp-tn  │
                                                     │   Port: 27017   │
                                                     └─────────────────┘
```

- **Frontend → Backend** : tous les appels (login, projets, users, etc.) passent par `http://localhost:3001/api`.
- **Backend → MongoDB** : NestJS utilise Mongoose avec `MONGODB_URI` ou par défaut `mongodb://localhost:27017/bmp-tn`.
- **Login** : `POST /api/users/login` avec `{ email, mot_de_passe }` → le backend lit la collection **users** dans MongoDB.

---

## Ordre recommandé pour tester

1. Démarrer **MongoDB**.
2. Lancer le **backend** (`cd backend` puis `npm run start:dev`).
3. Lancer le **seed** une fois (`npm run seed` dans `backend`).
4. Ouvrir **MongoDB Compass** et parcourir la base **bmp-tn**.
5. Lancer le **frontend vitrine** (`cd frontend` puis `npm run dev`) → **http://localhost:3000**
6. Lancer l’**admin** (`cd backend-react` puis `npm run dev`) → **http://localhost:5173** ; se connecter avec un compte du seed.

Si quelque chose ne marche pas, vérifiez : MongoDB démarré, backend sur 3001, frontend vitrine sur 3000, admin sur 5173, et que le seed a bien été exécuté.
