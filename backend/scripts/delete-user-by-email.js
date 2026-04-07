/* Usage: node scripts/delete-user-by-email.js jedidicyrine268@gmail.com */
require('dotenv').config();
const mongoose = require('mongoose');

const emailArg = process.argv[2] || 'jedidicyrine268@gmail.com';

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bmp-tn';
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection('users');
  const r1 = await col.deleteOne({ email: emailArg });
  let total = r1.deletedCount;
  if (r1.deletedCount === 0) {
    const r2 = await col.deleteMany({
      email: new RegExp(
        '^' + emailArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$',
        'i',
      ),
    });
    total = r2.deletedCount;
  }
  console.log('deletedCount:', total);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
