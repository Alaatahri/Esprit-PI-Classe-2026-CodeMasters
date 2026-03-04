# 🌱 Guide de Seed - Génération de Données de Test

## 📋 Description

Le script de seed permet de remplir automatiquement votre base de données MongoDB avec des données de test pour faciliter le développement et les tests de l'interface.

## 🚀 Utilisation

### Commande de base

```bash
cd backend
npm run seed
```

## 📊 Données Créées

Le script crée automatiquement :

### 👥 Utilisateurs (5)
- **1 Client** : Ahmed Ben Ali
- **1 Expert** : Sara Trabelsi  
- **1 Artisan** : Mohamed Khelifi
- **1 Fabricant** : Fatma Mansouri
- **1 Admin** : Admin BMP

### 🏗️ Projets (5)
1. **Construction Villa Moderne** - En cours (45%)
2. **Rénovation Appartement** - En attente (0%)
3. **Extension Maison** - Terminé (100%)
4. **Construction Immeuble Résidentiel** - En cours (25%)
5. **Aménagement Bureau** - En cours (60%)

### 📈 Suivis de Projets (2)
- Suivis de progression pour les projets en cours
- Mise à jour automatique de l'avancement des projets

### 💰 Devis (1)
- Devis avec 3 items pour un projet
- Calcul automatique du montant total

### 🛒 Produits Marketplace (3)
1. Ciment Portland CPJ45 - 12.5 TND
2. Briques Rouges - 0.85 TND
3. Tôles Galvanisées - 25.0 TND

### 📦 Commandes (1)
- Commande avec 2 items
- Calcul automatique du montant total

## 🔄 Comportement

- **Si la base est vide** : Le script crée toutes les données
- **Si des données existent** : Le script utilise les données existantes et ajoute seulement ce qui manque
- **Exécution multiple** : Vous pouvez exécuter le script plusieurs fois sans créer de doublons

## 🗑️ Réinitialiser les Données

Pour réinitialiser complètement la base de données :

```bash
# Option 1: Supprimer la base MongoDB
mongosh
use bmp-tn
db.dropDatabase()

# Puis relancer le seed
npm run seed
```

## 📝 Personnalisation

Vous pouvez modifier le fichier `src/scripts/seed.ts` pour :
- Ajouter plus d'utilisateurs
- Créer plus de projets
- Ajouter des données spécifiques à vos besoins

## ✅ Vérification

Après l'exécution du seed, vous pouvez vérifier les données :

```bash
# Via l'API
curl http://localhost:3001/api/users
curl http://localhost:3001/api/projects
curl http://localhost:3001/api/marketplace/produits
```

Ou via l'interface React sur `http://localhost:3000`

## 🎯 Prochaines Étapes

1. Démarrer le backend : `npm run start:dev`
2. Démarrer le frontend : `cd ../backend-react && npm run dev`
3. Ouvrir l'interface : `http://localhost:3000`
4. Explorer les données dans le Dashboard !
