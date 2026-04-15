/**
 * Corrige l’index unique sur emailVerificationToken (évite E11000 sur dup key null).
 *
 * mongosh :
 *   mongosh "mongodb://localhost:27017/bmp-tn" scripts/migrations/002-email-verification-token-index.mongodb.js
 */
const names = ['emailVerificationToken_1', 'email_verification_token_unique_string'];
for (const name of names) {
  try {
    db.users.dropIndex(name);
    print('Supprimé: ' + name);
  } catch (e) {
    print('Ignoré ' + name + ': ' + e);
  }
}
db.users.createIndex(
  { emailVerificationToken: 1 },
  {
    unique: true,
    name: 'email_verification_token_unique_string',
    partialFilterExpression: { emailVerificationToken: { $type: 'string' } },
  },
);
print('Créé: email_verification_token_unique_string');
