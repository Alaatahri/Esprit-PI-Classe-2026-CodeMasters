# 🚀 Démarrage Rapide - BMP.tn

## Démarrage en 3 étapes

### 1️⃣ Démarrer MongoDB
Assurez-vous que MongoDB est démarré sur `localhost:27017`

### 2️⃣ Démarrer le Backend (Terminal 1)
```bash
cd backend
npm run start:dev
```

### 3️⃣ Démarrer le Frontend (Terminal 2)
```bash
cd backend-react
npm run dev
```

## 🌐 Accès

- **Frontend (Interface)** : http://localhost:3000
- **Backend (API)** : http://localhost:3001/api

## 📊 Créer des données de test

Dans un nouveau terminal :
```bash
cd backend
npm run seed
```

Cela créera 3 utilisateurs et 3 projets pour tester l'interface.

## ✅ Vérification

1. Ouvrez http://localhost:3000 dans votre navigateur
2. Vous devriez voir le Dashboard avec les statistiques
3. Cliquez sur "Projets" pour voir la liste
4. Cliquez sur "Utilisateurs" pour voir la liste

**C'est tout ! 🎉**
