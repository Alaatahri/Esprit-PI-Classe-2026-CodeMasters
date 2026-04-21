const path = require('path');

function pickMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  return null;
}

async function main() {
  const emailArg = process.argv[2];
  const email = String(emailArg || '').trim().toLowerCase();
  if (!email) {
    throw new Error(
      'Email manquant. Usage: node backend/scripts/delete-user-by-email.js <email>',
    );
  }

  // Charge backend/.env si présent (sans écraser les vars déjà définies).
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const dotenv = require('dotenv');
    dotenv.config({
      path: path.resolve(__dirname, '..', '.env'),
      override: false,
    });
  } catch {
    // ignore
  }

  const uri = pickMongoUri();
  if (!uri) throw new Error('MONGODB_URI manquant (backend/.env).');

  // eslint-disable-next-line import/no-extraneous-dependencies
  const mongoose = require('mongoose');

  await mongoose.connect(uri);
  // Sur certaines versions, `connection.db` n’est disponible qu’après ouverture complète.
  await mongoose.connection.asPromise();

  const col = mongoose.connection.db.collection('users');
  const r = await col.deleteOne({ email });
  await mongoose.disconnect();

  process.stdout.write(JSON.stringify({ email, deletedCount: r.deletedCount }));
}

main().catch((e) => {
  process.stderr.write(
    `${e && e.message ? e.message : String(e)}\n`,
  );
  process.exit(1);
});
