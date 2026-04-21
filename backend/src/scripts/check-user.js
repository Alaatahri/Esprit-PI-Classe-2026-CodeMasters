const { MongoClient } = require('mongodb');

async function checkUser() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('bmp-tn');
    const users = db.collection('users');
    const sara = await users.findOne({ email: 'sara@example.com' });
    console.log('User found: ' + JSON.stringify(sara, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

checkUser();
