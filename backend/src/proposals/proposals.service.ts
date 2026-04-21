import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalDocument } from './schemas/proposal.schema';
import { ProjectService } from '../project/project.service';

function oid(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Identifiant invalide.');
  }
  return new Types.ObjectId(id);
}

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private readonly proposalModel: Model<ProposalDocument>,
    private readonly projectService: ProjectService,
  ) {}

  async findByProject(projectId: string) {
    if (!Types.ObjectId.isValid(projectId)) return [];
    return this.proposalModel
      .find({ projectId: oid(projectId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async createForProject(
    projectId: string,
    expertUserId: string,
    dto: {
      proposedPrice: number;
      estimatedDurationDays: number;
      technicalNotes?: string;
      materialSuggestions?: string;
    },
  ) {
    const project: any = await this.projectService.findOne(projectId);
    if (!project) throw new NotFoundException('Projet introuvable.');
    const exp = project.expertId?.toString?.();
    if (!exp || exp !== expertUserId) {
      throw new ForbiddenException('Seul l’expert assigné peut proposer.');
    }
    const doc = await this.proposalModel.create({
      projectId: oid(projectId),
      expertId: oid(expertUserId),
      status: 'sent',
      proposedPrice: dto.proposedPrice,
      estimatedDurationDays: dto.estimatedDurationDays,
      technicalNotes: dto.technicalNotes,
      materialSuggestions: dto.materialSuggestions,
    });
    return doc.toObject();
  }

  async revise(
    proposalId: string,
    expertUserId: string,
    dto: {
      proposedPrice: number;
      estimatedDurationDays: number;
      technicalNotes?: string;
      materialSuggestions?: string;
    },
  ) {
    const p = await this.proposalModel.findById(proposalId).exec();
    if (!p) throw new NotFoundException('Proposition introuvable.');
    if (p.expertId.toString() !== expertUserId) {
      throw new ForbiddenException();
    }
    if (p.status !== 'countered') {
      throw new BadRequestException('Révision impossible pour ce statut.');
    }
    p.proposedPrice = dto.proposedPrice;
    p.estimatedDurationDays = dto.estimatedDurationDays;
    p.technicalNotes = dto.technicalNotes;
    p.materialSuggestions = dto.materialSuggestions;
    p.status = 'sent';
    await p.save();
    return p.toObject();
  }

  async counter(
    proposalId: string,
    clientUserId: string,
    dto: {
      proposedPrice: number;
      estimatedDurationDays: number;
      message: string;
    },
  ) {
    const p = await this.proposalModel.findById(proposalId).exec();
    if (!p) throw new NotFoundException('Proposition introuvable.');
    const project: any = await this.projectService.findOne(
      String(p.projectId),
    );
    if (!project) throw new NotFoundException('Projet introuvable.');
    const clientRef = project.clientId?.toString?.();
    if (!clientRef || clientRef !== clientUserId) {
      throw new ForbiddenException('Seul le client peut contre-proposer.');
    }
    p.clientCounterPrice = dto.proposedPrice;
    p.clientCounterDurationDays = dto.estimatedDurationDays;
    p.clientCounterMessage = dto.message;
    p.lastClientCounterSnapshot = {
      proposedPrice: dto.proposedPrice,
      estimatedDurationDays: dto.estimatedDurationDays,
      message: dto.message,
      counteredAt: new Date().toISOString(),
    };
    p.status = 'countered';
    await p.save();
    return p.toObject();
  }

  async findOneRaw(id: string) {
    return this.proposalModel.findById(id).lean().exec();
  }

  async markAccepted(proposalId: string) {
    await this.proposalModel
      .findByIdAndUpdate(proposalId, { status: 'accepted' })
      .exec();
  }
}
