import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Facture, FactureDocument } from './schemas/facture.schema';
import { Paiement, PaiementDocument } from './schemas/paiement.schema';

@Injectable()
export class FacturesService implements OnModuleInit {
  constructor(
    @InjectModel(Facture.name) private factureModel: Model<FactureDocument>,
    @InjectModel(Paiement.name) private paiementModel: Model<PaiementDocument>,
  ) {}

  async onModuleInit() {
    // Migration automatique pour renommer toutes les factures en format "Facture N1, N2..."
    const factures = await this.factureModel.find({}).sort({ createdAt: 1 }).exec();
    for (let i = 0; i < factures.length; i++) {
        const expectedNum = `Facture N${i + 1}`;
        if (factures[i].numero_facture !== expectedNum) {
            factures[i].numero_facture = expectedNum;
            // On met aussi à jour le titre si c'est un titre par défaut ou ancien format
            if (!factures[i].titre || factures[i].titre.startsWith('FAC-') || factures[i].titre.startsWith('Facture pour')) {
                factures[i].titre = expectedNum;
            }
            await factures[i].save();
        }
    }
  }

  async create(createFactureDto: any): Promise<Facture> {
    if (!createFactureDto.numero_facture) {
      const count = await this.factureModel.countDocuments({ numero_facture: /^Facture N/ }).exec();
      const num = 'Facture N' + (count + 1);
      createFactureDto.numero_facture = num;
      // Si le titre commence par "Facture pour" ou est absent, on met le numéro de facture comme titre principal
      if (!createFactureDto.titre || createFactureDto.titre.startsWith('Facture pour ')) {
        createFactureDto.titre = num;
      }
    }

    if (createFactureDto.temp_client_email) {
      createFactureDto.temp_client_email = createFactureDto.temp_client_email.toLowerCase();
    }

    // Calcul vrai et réel du total si manquant ou invalide
    const articles = createFactureDto.articles || [];
    if (articles.length > 0) {
      const sumHT = articles.reduce((sum, a) => sum + (Number(a.total) || (Number(a.prix_unitaire) * Number(a.quantite)) || 0), 0);
      const ttc = Math.round(sumHT * 1.19 * 1000) / 1000;
      if (!createFactureDto.montant_total || createFactureDto.montant_total <= 0) {
        createFactureDto.montant_total = ttc;
      }
    }

    createFactureDto.solde_du = (createFactureDto.montant_total || 0) - (createFactureDto.montant_paye || 0);
    const created = new this.factureModel(createFactureDto);
    return created.save();
  }

  async findAll(query: any): Promise<Facture[]> {
    const filter: any = {};
    const { userId, userRole, userEmail, clientId, artisanId, projectId } = query || {};

    if (projectId) filter.projectId = new Types.ObjectId(projectId);

    if (userRole === 'client') {
      const clientQueries = [];
      if (userId) clientQueries.push({ clientId: new Types.ObjectId(userId) });
      if (userEmail) clientQueries.push({ temp_client_email: userEmail.toLowerCase() });
      
      if (clientQueries.length > 0) {
        filter.$or = clientQueries;
      }
      // For clients, hide draft invoices? Usually yes.
      filter.statut = { $ne: 'brouillon' };
    } else {
      if (clientId) filter.clientId = new Types.ObjectId(clientId);
      if (artisanId) filter.artisanId = new Types.ObjectId(artisanId);
    }

    return this.factureModel.find(filter).sort({ date_facture: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Facture> {
    return this.factureModel.findById(id).exec();
  }

  async addPaiement(id: string, paiementDto: any): Promise<any> {
    const facture = await this.factureModel.findById(id);
    if (!facture) throw new NotFoundException('Facture non trouvée');

    const paiement = new this.paiementModel({
      ...paiementDto,
      factureId: new Types.ObjectId(id),
    });
    await paiement.save();

    const montant = Number(paiementDto.montant) || 0;
    facture.montant_paye = (facture.montant_paye || 0) + montant;
    facture.solde_du = Math.max(0, facture.montant_total - facture.montant_paye);
    
    if (facture.solde_du <= 0) {
      facture.statut = 'payée';
    } else if (facture.montant_paye > 0) {
      facture.statut = 'partiellement_payée';
    }

    await facture.save();
    return { facture, paiement };
  }

  async endpointAction(id: string, endpoint: string): Promise<any> {
    const facture = await this.factureModel.findById(id);
    if (!facture) throw new NotFoundException('Facture not found');
    if (endpoint === 'envoyer') {
      facture.statut = 'envoyée';
    }
    await facture.save();
    return facture;
  }

  async findPaymentsByFactureId(id: string): Promise<Paiement[]> {
    return this.paiementModel.find({ factureId: new Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllPaiements(query: any): Promise<Paiement[]> {
    const { userId, userRole, userEmail } = query || {};
    const filter: any = {};

    if (userRole === 'artisan' && userId) {
       // Filter payments for invoices belonging to this artisan
       const artisanInvoices = await this.factureModel.find({ artisanId: new Types.ObjectId(userId) }).select('_id');
       filter.factureId = { $in: artisanInvoices.map(i => i._id) };
    } else if (userRole === 'client') {
       const clientQueries = [];
       if (userId) clientQueries.push({ clientId: new Types.ObjectId(userId) });
       if (userEmail) clientQueries.push({ temp_client_email: userEmail.toLowerCase() });
       
       if (clientQueries.length > 0) {
         const clientInvoices = await this.factureModel.find({ $or: clientQueries }).select('_id');
         filter.factureId = { $in: clientInvoices.map(i => i._id) };
       } else {
         // No user info? Return nothing for safety
         filter.factureId = { $in: [] };
       }
    }

    return this.paiementModel.find(filter)
      .populate({
        path: 'factureId',
        select: 'numero_facture titre temp_client_nom temp_client_email clientId artisanId',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPaiementStats(query?: any): Promise<any> {
    const { userId, userRole, userEmail } = query || {};
    const factureFilter: any = {};
    const paiementFilter: any = {};

    if (userRole === 'artisan' && userId) {
      factureFilter.artisanId = new Types.ObjectId(userId);
      const invoices = await this.factureModel.find(factureFilter).select('_id');
      paiementFilter.factureId = { $in: invoices.map(i => i._id) };
    } else if (userRole === 'client') {
      const clientQueries = [];
      if (userId) clientQueries.push({ clientId: new Types.ObjectId(userId) });
      if (userEmail) clientQueries.push({ temp_client_email: userEmail.toLowerCase() });

      if (clientQueries.length > 0) {
        factureFilter.$or = clientQueries;
        const invoices = await this.factureModel.find(factureFilter).select('_id');
        paiementFilter.factureId = { $in: invoices.map(i => i._id) };
      } else {
        factureFilter._id = null; // No results
        paiementFilter.factureId = { $in: [] };
      }
    }

    const [paiements, factures] = await Promise.all([
      this.paiementModel.find(paiementFilter).exec(),
      this.factureModel.find(factureFilter).exec(),
    ]);

    const volumeTotal = paiements.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
    const sommeFactures = factures.reduce((sum, f) => sum + (Number(f.montant_total) || 0), 0);
    const sommePayee = factures.reduce((sum, f) => sum + (Number(f.montant_paye) || 0), 0);

    return {
      volumeTotal,
      sommeFactures,
      sommePayee,
      transactions: paiements.length,
      carte: paiements.filter(p => p.methode_paiement === 'carte').length,
      virement: paiements.filter(p => p.methode_paiement === 'virement').length,
      especes: paiements.filter(p => p.methode_paiement === 'especes').length,
      paypal: paiements.filter(p => p.methode_paiement === 'paypal').length,
      flouci: paiements.filter(p => p.methode_paiement === 'flouci').length,
    };
  }
}
