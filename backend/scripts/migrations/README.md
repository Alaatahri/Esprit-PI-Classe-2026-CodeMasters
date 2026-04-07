# Migrations MongoDB (additives)

Ce projet utilise **Mongoose**, pas TypeORM : il n’y a pas de `synchronize` SQL.

Les nouveaux champs (`isEmailVerified`, `emailVerificationToken`, `emailVerificationExpires`) sont définis dans `src/user/schemas/user.schema.ts` avec des **valeurs par défaut** compatibles avec les comptes existants.

Le script `001-email-verification-users.mongodb.js` est **optionnel** : il force `isEmailVerified: true` sur les documents qui n’avaient pas encore ce champ (équivalent d’un défaut en base). Sans ce script, les anciens utilisateurs restent considérés comme vérifiés côté application (`isEmailVerified !== false`).
