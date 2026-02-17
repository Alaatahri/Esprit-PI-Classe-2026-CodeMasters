# 🔍 Guide de Débogage - Problème de Login

## Vérifications à faire

### 1. Vérifier que le backend fonctionne
```bash
cd backend
npm run start:dev
```

Vérifiez que vous voyez : `🚀 Backend server running on http://localhost:3001`

### 2. Vérifier que les utilisateurs existent
Testez l'API directement :
```bash
curl http://localhost:3001/api/users
```

Ou dans votre navigateur : `http://localhost:3001/api/users`

### 3. Tester le login directement
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@example.com","mot_de_passe":"password123"}'
```

### 4. Vérifier la console du navigateur
Ouvrez la console (F12) et regardez les erreurs :
- Erreurs réseau (CORS, connexion refusée)
- Erreurs JavaScript
- Logs de débogage

### 5. Vérifier que le frontend est démarré
```bash
cd backend-react
npm run dev
```

## Comptes de test

Assurez-vous d'avoir exécuté le seed :
```bash
cd backend
npm run seed
```

Comptes disponibles :
- **Client** : `ahmed@example.com` / `password123`
- **Expert** : `sara@example.com` / `password123`
- **Artisan** : `mohamed@example.com` / `password123`
- **Fabricant** : `fatma@example.com` / `password123`
- **Admin** : `admin@bmp.tn` / `admin123`

## Problèmes courants

### Erreur : "Cannot connect to API"
- Vérifiez que le backend est démarré sur le port 3001
- Vérifiez l'URL dans `backend-react/src/services/api.ts`

### Erreur : "Email ou mot de passe incorrect"
- Vérifiez que les utilisateurs existent dans MongoDB
- Vérifiez que le mot de passe correspond exactement
- Exécutez `npm run seed` pour créer les utilisateurs

### Rien ne se passe quand on clique sur "Se connecter"
- Ouvrez la console du navigateur (F12)
- Vérifiez les erreurs JavaScript
- Vérifiez que le formulaire est bien soumis

## Solution rapide

1. Redémarrer le backend :
```bash
cd backend
npm run start:dev
```

2. Redémarrer le frontend :
```bash
cd backend-react
npm run dev
```

3. Vider le cache du navigateur (Ctrl+Shift+R)

4. Réessayer de se connecter
