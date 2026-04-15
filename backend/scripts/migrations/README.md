# Migrations MongoDB (additives)

Ce projet utilise **Mongoose**, pas TypeORM : il n’y a pas de `synchronize` SQL.

Les nouveaux champs (`isEmailVerified`, `emailVerificationToken`, `emailVerificationExpires`) sont définis dans `src/user/schemas/user.schema.ts` avec des **valeurs par défaut** compatibles avec les comptes existants.

Le script `001-email-verification-users.mongodb.js` est **optionnel** : il force `isEmailVerified: true` sur les documents qui n’avaient pas encore ce champ (équivalent d’un défaut en base). Sans ce script, les anciens utilisateurs restent considérés comme vérifiés côté application (`isEmailVerified !== false`).

### Index `emailVerificationToken` (E11000 / lien de vérification)

Si la base a encore l’ancien index unique **sans** filtre partiel, plusieurs comptes avec jeton absent/`null` provoquent `duplicate key ... emailVerificationToken: null` et la vérification d’e-mail échoue.

- **Recommandé** : depuis le dossier `backend/`, exécuter  
  `node scripts/fix-email-verification-token-index.js`  
  (utilise `MONGODB_URI` du `.env`).

- Alternative **mongosh** : `002-email-verification-token-index.mongodb.js`.
