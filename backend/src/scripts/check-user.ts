import { MongoClient } from 'mongodb';

async function checkUser() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('bmp-tn');
    const users = db.collection('users');
    const sara = await users.findOne({ email: 'sara@example.com' });
    if (sara) {
      console.log('User found:', sara.email);
      console.log('Password in DB:', sara.mot_de_passe);
      console.log('isEmailVerified:', sara.isEmailVerified);
    } else {
      console.log('User NOT found: sara@example.com');
      const all = await users.find({}).toArray();
      console.log('Total users in DB:', all.length);
      if (all.length > 0) {
        console.log('Example users:', all.slice(0, 5).map(u => u.email));
      }
    }
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
  }
}

checkUser();
