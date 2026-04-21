import { MongoClient } from 'mongodb';

async function fixLogin() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('bmp-tn');
    const users = db.collection('users');

    const testUsers = [
      {
        nom: 'Ahmed Ben Ali',
        email: 'ahmed@example.com',
        mot_de_passe: 'password123',
        role: 'client',
        isEmailVerified: true
      },
      {
        prenom: 'Sara',
        nom: 'Trabelsi',
        email: 'sara@example.com',
        mot_de_passe: 'password123',
        role: 'expert',
        isEmailVerified: true
      },
      {
        nom: 'Admin BMP',
        email: 'admin@bmp.tn',
        mot_de_passe: 'admin123',
        role: 'admin',
        isEmailVerified: true
      }
    ];

    for (const u of testUsers) {
      const existing = await users.findOne({ email: u.email });
      if (existing) {
        console.log(`Updating user: ${u.email}`);
        await users.updateOne({ email: u.email }, { $set: { mot_de_passe: u.mot_de_passe, isEmailVerified: true } });
      } else {
        console.log(`Creating user: ${u.email}`);
        await users.insertOne({
          ...u,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    console.log('✅ Fix login finished.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

fixLogin();
