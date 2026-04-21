import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument } from './schemas/contract.schema';
import { ProjectService } from '../project/project.service';
import { ProposalsService } from '../proposals/proposals.service';
import { UserService } from '../user/user.service';

function oid(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Identifiant invalide.');
  }
  return new Types.ObjectId(id);
}

const MINIMAL_PDF = Buffer.from(
  [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj',
    'xref',
    '0 4',
    '0000000000 65535 f ',
    'trailer<</Size 4/Root 1 0 R>>',
    'startxref',
    '120',
    '%%EOF',
  ].join('\n'),
  'utf8',
);

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private readonly contractModel: Model<ContractDocument>,
    private readonly projectService: ProjectService,
    private readonly proposalsService: ProposalsService,
    private readonly userService: UserService,
  ) {}

  async findByProject(projectId: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      return { contract: null };
    }
    const c = await this.contractModel
      .findOne({ projectId: oid(projectId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return { contract: c };
  }

  async acceptProposal(
    proposalId: string,
    clientUserId: string,
    clientName: string,
  ) {
    const prop: any = await this.proposalsService.findOneRaw(proposalId);
    if (!prop) throw new NotFoundException('Proposition introuvable.');
    if (prop.status !== 'sent' && prop.status !== 'countered') {
      throw new BadRequestException('Cette proposition ne peut plus être acceptée.');
    }
    const project: any = await this.projectService.findOne(
      String(prop.projectId),
    );
    if (!project) throw new NotFoundException('Projet introuvable.');
    if (project.clientId?.toString?.() !== clientUserId) {
      throw new ForbiddenException();
    }

    const existing = await this.contractModel
      .findOne({ projectId: prop.projectId })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException('Un contrat existe déjà pour ce projet.');
    }

    const text = `Contrat BMP.tn — ${clientName}\nProjet: ${project.titre}\nMontant proposé: ${prop.proposedPrice} TND\nDurée: ${prop.estimatedDurationDays} jours\n`;

    const doc = await this.contractModel.create({
      projectId: prop.projectId,
      proposalId: oid(proposalId),
      status: 'pending_signatures',
      contractText: text,
    });
    await this.proposalsService.markAccepted(proposalId);
    return doc.toObject();
  }

  async signContract(contractId: string, userId: string) {
    const c = await this.contractModel.findById(contractId).exec();
    if (!c) throw new NotFoundException('Contrat introuvable.');
    const user: any = await this.userService.findOne(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    const role = String(user.role || '');
    const now = new Date();
    if (role === 'client') {
      c.clientSignedAt = now;
    } else if (role === 'expert') {
      c.expertSignedAt = now;
    } else {
      throw new ForbiddenException('Signature réservée au client ou à l’expert.');
    }
    if (c.clientSignedAt && c.expertSignedAt) {
      c.status = 'signed';
    }
    await c.save();
    return c.toObject();
  }

  getPdfBuffer(): Buffer {
    return MINIMAL_PDF;
  }

  async setClientPdfUrl(contractId: string, clientUserId: string, url: string) {
    const c = await this.contractModel.findById(contractId).exec();
    if (!c) throw new NotFoundException('Contrat introuvable.');
    const project: any = await this.projectService.findOne(String(c.projectId));
    if (!project || project.clientId?.toString?.() !== clientUserId) {
      throw new ForbiddenException();
    }
    c.clientSignedPdfUrl = url;
    await c.save();
    return c.toObject();
  }

  async setExpertPdfUrl(contractId: string, expertUserId: string, url: string) {
    const c = await this.contractModel.findById(contractId).exec();
    if (!c) throw new NotFoundException('Contrat introuvable.');
    const project: any = await this.projectService.findOne(String(c.projectId));
    if (!project || project.expertId?.toString?.() !== expertUserId) {
      throw new ForbiddenException();
    }
    c.expertSignedPdfUrl = url;
    await c.save();
    return c.toObject();
  }
}
