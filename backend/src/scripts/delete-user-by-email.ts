import 'dotenv/config';

import mongoose, { Types } from 'mongoose';

type DeleteResult = { deletedCount?: number };

function envMongoUri(): string {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/bmp-tn';
}

async function del(
  modelName: string,
  filter: Record<string, unknown>,
): Promise<number> {
  const model = mongoose.model(modelName);
  const res = (await model.deleteMany(filter)) as unknown as DeleteResult;
  return Number(res?.deletedCount || 0);
}

async function run() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    throw new Error(
      'Usage: npm run delete:user -- <email>\nEx: npm run delete:user -- jedidicyrine268@gmail.com',
    );
  }

  await mongoose.connect(envMongoUri());

  // Chargement "brut" des collections via modèles déjà enregistrés par Nest (dans src/...)
  // Ici on crée des modèles minimaux pour supprimer, sans dépendre du bootstrap Nest.
  const User = mongoose.model(
    'User',
    new mongoose.Schema({}, { strict: false, collection: 'users' }),
  );
  const Project = mongoose.model(
    'Project',
    new mongoose.Schema({}, { strict: false, collection: 'projects' }),
  );
  const Devis = mongoose.model(
    'Devis',
    new mongoose.Schema({}, { strict: false, collection: 'devis' }),
  );
  const Proposal = mongoose.model(
    'Proposal',
    new mongoose.Schema({}, { strict: false, collection: 'proposals' }),
  );
  const Contract = mongoose.model(
    'Contract',
    new mongoose.Schema({}, { strict: false, collection: 'contracts' }),
  );
  const Message = mongoose.model(
    'Message',
    new mongoose.Schema({}, { strict: false, collection: 'messages' }),
  );
  const Produit = mongoose.model(
    'Produit',
    new mongoose.Schema({}, { strict: false, collection: 'produits' }),
  );
  const Commande = mongoose.model(
    'Commande',
    new mongoose.Schema({}, { strict: false, collection: 'commandes' }),
  );
  const MatchingRequest = mongoose.model(
    'MatchingRequest',
    new mongoose.Schema({}, { strict: false, collection: 'matchingrequests' }),
  );
  const Alert = mongoose.model(
    'Alert',
    new mongoose.Schema({}, { strict: false, collection: 'alerts' }),
  );
  const AppNotification = mongoose.model(
    'AppNotification',
    new mongoose.Schema({}, { strict: false, collection: 'notifications' }),
  );
  // `Suivi` et `SuiviProject` pointent sur la même collection Mongo: `suiviprojects`
  const SuiviProjects = mongoose.model(
    'SuiviProjects',
    new mongoose.Schema({}, { strict: false, collection: 'suiviprojects' }),
  );

  const u = await User.findOne({ email }).lean().exec();
  if (!u?._id) {
    console.log(`NOT_FOUND: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const userId = new Types.ObjectId(String(u._id));
  console.log(`Found user: ${email} (_id=${userId.toString()})`);

  // Supprimer docs dépendants
  // Messages
  const messagesDeleted = await Message.deleteMany({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  });

  // Marketplace
  const produitsDeleted = await Produit.deleteMany({ vendeurId: userId });
  const commandesDeleted = await Commande.deleteMany({ clientId: userId });

  // Projets (et embedded applications.artisanId)
  const projectsClientDeleted = await Project.deleteMany({ clientId: userId });
  const projectsExpertCleared = await Project.updateMany(
    { expertId: userId },
    { $unset: { expertId: '' } },
  );
  const projectsAppsPulled = await Project.updateMany(
    { 'applications.artisanId': userId },
    { $pull: { applications: { artisanId: userId } } },
  );

  // Devis / Proposals / Contracts / Matching
  const devisDeleted = await Devis.deleteMany({
    $or: [{ clientId: userId }, { expertId: userId }],
  });
  const proposalsDeleted = await Proposal.deleteMany({ expertId: userId });
  const contractsDeleted = await Contract.deleteMany({
    $or: [{ clientId: userId }, { expertId: userId }],
  });
  const matchingDeleted = await MatchingRequest.deleteMany({ expertId: userId });

  // Alerts / notifications / suivi
  const alertsDeleted = await Alert.deleteMany({ workerId: userId });
  const appNotifDeleted = await AppNotification.deleteMany({
    recipientId: userId,
  });
  const suiviProjectsDeleted = await SuiviProjects.deleteMany({
    workerId: userId,
  });

  // Enfin, supprimer l'utilisateur
  const userDeleted = await User.deleteOne({ _id: userId });

  console.log('Delete summary:', {
    messages: (messagesDeleted as any)?.deletedCount ?? 0,
    produits: (produitsDeleted as any)?.deletedCount ?? 0,
    commandes: (commandesDeleted as any)?.deletedCount ?? 0,
    projectsClient: (projectsClientDeleted as any)?.deletedCount ?? 0,
    projectsExpertUnset: (projectsExpertCleared as any)?.modifiedCount ?? 0,
    projectsApplicationsPulled: (projectsAppsPulled as any)?.modifiedCount ?? 0,
    devis: (devisDeleted as any)?.deletedCount ?? 0,
    proposals: (proposalsDeleted as any)?.deletedCount ?? 0,
    contracts: (contractsDeleted as any)?.deletedCount ?? 0,
    matchingRequests: (matchingDeleted as any)?.deletedCount ?? 0,
    alerts: (alertsDeleted as any)?.deletedCount ?? 0,
    appNotifications: (appNotifDeleted as any)?.deletedCount ?? 0,
    suiviProjects: (suiviProjectsDeleted as any)?.deletedCount ?? 0,
    user: (userDeleted as any)?.deletedCount ?? 0,
  });

  const stillThere = await User.findOne({ email }).lean().exec();
  console.log(stillThere ? 'FAILED: user still exists' : 'OK: user removed');

  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});

