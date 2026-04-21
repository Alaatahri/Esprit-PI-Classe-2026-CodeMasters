/**
 * Remplace l’index unique défectueux sur emailVerificationToken (plusieurs null → E11000)
 * par un index unique partiel : seules les valeurs de type string sont indexées.
 *
 * Usage (depuis backend/) :
 *   node scripts/fix-email-verification-token-index.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const INDEX_NAME = 'email_verification_token_unique_string';

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bmp-tn';
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('users');

  const before = await col.indexes();
  console.log(
    'Index existants (users):',
    before.map((i) => i.name).join(', '),
  );

  const toDrop = ['emailVerificationToken_1', INDEX_NAME];
  for (const name of toDrop) {
    try {
      await col.dropIndex(name);
      console.log(`Supprimé: ${name}`);
    } catch (e) {
      if (e?.codeName === 'IndexNotFound' || /index not found/i.test(String(e?.message))) {
        console.log(`(absent) ${name}`);
      } else {
        throw e;
      }
    }
  }

  await col.createIndex(
    { emailVerificationToken: 1 },
    {
      unique: true,
      name: INDEX_NAME,
      partialFilterExpression: { emailVerificationToken: { $type: 'string' } },
    },
  );
  console.log(`Créé: ${INDEX_NAME} (unique + partiel sur string)`);

  await mongoose.disconnect();
  console.log('OK.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
