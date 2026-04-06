import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../project/schemas/project.schema';
import { Proposal, ProposalDocument } from './schemas/proposal.schema';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name)
    private readonly proposalModel: Model<ProposalDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  private oid(id: string, label: string) {
    const s = String(id || '').trim();
    if (!Types.ObjectId.isValid(s))
      throw new BadRequestException(`${label} invalide.`);
    return new Types.ObjectId(s);
  }

  async listByProject(projectId: string) {
    const pid = this.oid(projectId, 'projectId');
    return this.proposalModel
      .find({ projectId: pid })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async createForProject(args: {
    projectId: string;
    expertId: string;
    proposedPrice: number;
    estimatedDurationDays: number;
    technicalNotes: string;
    materialSuggestions?: string;
  }) {
    const pid = this.oid(args.projectId, 'projectId');
    const eid = this.oid(args.expertId, 'expertId');

    const project: any = await this.projectModel.findById(pid).lean().exec();
    if (!project) throw new NotFoundException('Projet introuvable.');

    const assigned = project?.expertId?.toString?.();
    if (!assigned || assigned !== String(args.expertId)) {
      throw new ForbiddenException(
        'Seul l’expert assigné peut envoyer une proposition.',
      );
    }

    const price = Number(args.proposedPrice);
    const days = Number(args.estimatedDurationDays);
    const notes = String(args.technicalNotes || '').trim();
    if (!Number.isFinite(price) || price < 0)
      throw new BadRequestException('Prix invalide.');
    if (!Number.isFinite(days) || days < 1)
      throw new BadRequestException('Durée invalide.');
    if (!notes) throw new BadRequestException('Notes techniques requises.');

    const created = await this.proposalModel.create({
      projectId: pid,
      expertId: eid,
      proposedPrice: price,
      estimatedDurationDays: days,
      technicalNotes: notes,
      materialSuggestions: args.materialSuggestions
        ? String(args.materialSuggestions).trim()
        : undefined,
      status: 'sent',
    });

    // Marquer le workflow du projet
    await this.projectModel
      .findByIdAndUpdate(pid, { requestStatus: 'proposal_sent' })
      .exec();

    return created.toObject();
  }

  async rejectProposal(proposalId: string, clientId: string) {
    const id = this.oid(proposalId, 'proposalId');
    const cid = this.oid(clientId, 'clientId');
    const proposal: any = await this.proposalModel.findById(id).lean().exec();
    if (!proposal) throw new NotFoundException('Proposition introuvable.');

    const project: any = await this.projectModel
      .findById(proposal.projectId)
      .lean()
      .exec();
    if (!project) throw new NotFoundException('Projet introuvable.');
    if (String(project.clientId) !== String(cid)) {
      throw new ForbiddenException('Accès refusé.');
    }

    await this.proposalModel
      .findByIdAndUpdate(id, { status: 'rejected' })
      .exec();
    await this.projectModel
      .findByIdAndUpdate(project._id, { requestStatus: 'rejected' })
      .exec();
    return { ok: true };
  }

  /** Client : contre-proposition (négociation). */
  async counterByClient(args: {
    proposalId: string;
    clientId: string;
    proposedPrice: number;
    estimatedDurationDays: number;
    message: string;
  }) {
    const id = this.oid(args.proposalId, 'proposalId');
    const cid = this.oid(args.clientId, 'clientId');

    const proposal: any = await this.proposalModel.findById(id).lean().exec();
    if (!proposal) throw new NotFoundException('Proposition introuvable.');

    const project: any = await this.projectModel
      .findById(proposal.projectId)
      .lean()
      .exec();
    if (!project) throw new NotFoundException('Projet introuvable.');
    if (String(project.clientId) !== String(cid)) {
      throw new ForbiddenException('Accès refusé.');
    }

    if (proposal.status !== 'sent') {
      throw new BadRequestException(
        'Seule une proposition en attente peut faire l’objet d’une contre-proposition.',
      );
    }

    const price = Number(args.proposedPrice);
    const days = Number(args.estimatedDurationDays);
    const msg = String(args.message || '').trim();
    if (!Number.isFinite(price) || price < 0)
      throw new BadRequestException('Prix invalide.');
    if (!Number.isFinite(days) || days < 1)
      throw new BadRequestException('Durée invalide.');
    if (!msg) throw new BadRequestException('Message requis.');

    const updated = await this.proposalModel
      .findByIdAndUpdate(
        id,
        {
          clientCounterPrice: price,
          clientCounterDurationDays: days,
          clientCounterMessage: msg,
          counteredAt: new Date(),
          status: 'countered',
        },
        { new: true },
      )
      .lean()
      .exec();

    await this.projectModel
      .findByIdAndUpdate(project._id, { requestStatus: 'negotiation' })
      .exec();

    return updated;
  }

  /** Expert : révise la proposition après contre-proposition du client. */
  async reviseByExpert(args: {
    proposalId: string;
    expertId: string;
    proposedPrice: number;
    estimatedDurationDays: number;
    technicalNotes: string;
    materialSuggestions?: string;
  }) {
    const id = this.oid(args.proposalId, 'proposalId');
    const eid = this.oid(args.expertId, 'expertId');

    const proposal: any = await this.proposalModel.findById(id).lean().exec();
    if (!proposal) throw new NotFoundException('Proposition introuvable.');

    if (String(proposal.expertId) !== String(eid)) {
      throw new ForbiddenException(
        'Seul l’expert auteur peut réviser cette proposition.',
      );
    }

    if (proposal.status !== 'countered') {
      throw new BadRequestException(
        'Aucune contre-proposition en attente de réponse.',
      );
    }

    const price = Number(args.proposedPrice);
    const days = Number(args.estimatedDurationDays);
    const notes = String(args.technicalNotes || '').trim();
    if (!Number.isFinite(price) || price < 0)
      throw new BadRequestException('Prix invalide.');
    if (!Number.isFinite(days) || days < 1)
      throw new BadRequestException('Durée invalide.');
    if (!notes) throw new BadRequestException('Notes techniques requises.');

    const snapshot =
      proposal.clientCounterPrice != null &&
      proposal.clientCounterDurationDays != null &&
      proposal.clientCounterMessage
        ? {
            proposedPrice: Number(proposal.clientCounterPrice),
            estimatedDurationDays: Number(proposal.clientCounterDurationDays),
            message: String(proposal.clientCounterMessage),
            counteredAt: proposal.counteredAt
              ? new Date(proposal.counteredAt)
              : undefined,
          }
        : undefined;

    const updated = await this.proposalModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            proposedPrice: price,
            estimatedDurationDays: days,
            technicalNotes: notes,
            materialSuggestions: args.materialSuggestions
              ? String(args.materialSuggestions).trim()
              : undefined,
            status: 'sent',
            ...(snapshot ? { lastClientCounterSnapshot: snapshot } : {}),
          },
          $unset: {
            clientCounterPrice: 1,
            clientCounterDurationDays: 1,
            clientCounterMessage: 1,
            counteredAt: 1,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    await this.projectModel
      .findByIdAndUpdate(proposal.projectId, { requestStatus: 'proposal_sent' })
      .exec();

    return updated;
  }
}
