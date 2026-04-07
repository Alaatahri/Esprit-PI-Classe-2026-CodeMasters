/**
 * Migration additive MongoDB — collection `users` (équivalent ADD COLUMN avec défaut).
 * Sans effet destructif : ne supprime ni ne modifie les champs existants.
 *
 * Exécution (mongosh) :
 *   mongosh "mongodb://localhost:27017/bmp-tn" scripts/migrations/001-email-verification-users.mongodb.js
 *
 * Les documents sans `isEmailVerified` sont alignés sur true (comportement legacy = déjà vérifiés).
 */
const dbName = db.getName();
print(`Migration 001 — ${dbName} — email verification fields`);

const r = db.users.updateMany(
  { isEmailVerified: { $exists: false } },
  { $set: { isEmailVerified: true } },
);
printjson(r);
