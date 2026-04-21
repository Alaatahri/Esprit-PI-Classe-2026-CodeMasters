import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Devis, DevisDocument } from './schemas/devis.schema';
import { Project, ProjectDocument } from '../project/schemas/project.schema';

@Injectable()
export class DevisService {
  constructor(
    @InjectModel(Devis.name) private devisModel: Model<DevisDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createDevisDto: any): Promise<Devis> {
    if (!createDevisDto.numero_devis) {
      createDevisDto.numero_devis = 'DEV-' + Date.now();
    }
    
    // Auto-link clientId from project if missing
    if (!createDevisDto.clientId && createDevisDto.projectId) {
       try {
         const project = await this.projectModel.findById(createDevisDto.projectId);
         if (project && project.clientId) {
           createDevisDto.clientId = project.clientId;
         }
       } catch (e) {}
    }

    if (createDevisDto.temp_client_email) {
      createDevisDto.temp_client_email = createDevisDto.temp_client_email.toLowerCase();
    }

    const createdDevis = new this.devisModel({
      ...createDevisDto,
      statut: createDevisDto.envoyer ? 'envoyé' : 'brouillon',
      date_creation: new Date(),
      montant_total: Math.round((createDevisDto.articles?.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0) || 0) * 1.19 * 1000) / 1000,
    });
    return createdDevis.save();
  }

  async findAll(query?: any): Promise<Devis[]> {
    const filter: any = {};
    const { userId, userRole, userEmail, artisanId, clientId, projectId } = query || {};

    if (projectId) filter.projectId = new Types.ObjectId(projectId);
    
    // Server-side identity filtering disabled for experts/artisans to show all
    if (userRole === 'client') {
      const clientQueries = [];
      if (userId) clientQueries.push({ clientId: new Types.ObjectId(userId) });
      if (userEmail) clientQueries.push({ temp_client_email: userEmail.toLowerCase() });
      
      if (clientQueries.length > 0) {
        filter.$or = clientQueries;
      } else {
        filter._id = null; // No results
      }
      // For clients, only show sent or accepted devis
      filter.statut = { $in: ['envoyé', 'accepté', 'refusé'] };
    } else {
      // Manual query overrides
      if (clientId) filter.clientId = new Types.ObjectId(clientId);
      if (artisanId) filter.artisanId = new Types.ObjectId(artisanId);
    }

    return this.devisModel.find(filter).sort({ date_creation: -1 }).exec();
  }

  async findOne(id: string): Promise<Devis> {
    return this.devisModel.findById(id).exec();
  }

  async update(id: string, updateDevisDto: any): Promise<Devis> {
    const total = updateDevisDto.articles?.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0) || 0;
    if (updateDevisDto.articles) {
       updateDevisDto.montant_total = total;
    }
    return this.devisModel
      .findByIdAndUpdate(id, updateDevisDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Devis> {
    return this.devisModel.findByIdAndDelete(id).exec();
  }

  async endpointAction(id: string, endpoint: string): Promise<any> {
    const devis = await this.devisModel.findById(id);
    if (!devis) throw new NotFoundException('Devis non trouvé');
    
    if (endpoint === 'envoyer') {
      devis.statut = 'envoyé';
      devis.date_envoi = new Date();
    } else if (endpoint === 'accepter') {
      devis.statut = 'accepté';
      devis.date_acceptation = new Date();
      // Facture generation will be handled by the controller
    } else if (endpoint === 'refuser') {
      devis.statut = 'refusé';
    }
    await devis.save();
    return devis;
  }
}
