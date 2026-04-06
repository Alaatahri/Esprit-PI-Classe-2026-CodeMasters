import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import PDFDocument from 'pdfkit';
import { Model, Types } from 'mongoose';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Project, ProjectDocument } from '../project/schemas/project.schema';
import {
  Proposal,
  ProposalDocument,
} from '../proposals/schemas/proposal.schema';
import { Contract, ContractDocument } from './schemas/contract.schema';

function clampDate(d: Date) {
  const t = d.getTime();
  if (Number.isNaN(t)) return new Date();
  return d;
}

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Proposal.name)
    private readonly proposalModel: Model<ProposalDocument>,
  ) {}

  private oid(id: string, label: string) {
    const s = String(id || '').trim();
    if (!Types.ObjectId.isValid(s))
      throw new BadRequestException(`${label} invalide.`);
    return new Types.ObjectId(s);
  }

  /** Compare ObjectId, string ou doc peuplé Mongoose */
  private refId(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'object' && v !== null && '_id' in v) {
      return String((v as { _id: unknown })._id);
    }
    return String(v);
  }

  /** Navigateurs / OS envoient parfois application/octet-stream pour un .pdf */
  private isLikelyPdfFile(file: { mimetype: string; originalname?: string }) {
    const m = String(file.mimetype || '')
      .toLowerCase()
      .trim();
    const name = String(file.originalname || '')
      .toLowerCase()
      .trim();
    if (m.includes('pdf')) return true;
    if (name.endsWith('.pdf')) return true;
    if (m === 'application/octet-stream' && name.endsWith('.pdf')) return true;
    return false;
  }

  private buildPdfBuffer(title: string, body: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text('BMP.tn — contrat de prestation', { align: 'center' });
      doc.moveDown(1.2);
      doc.fillColor('#000000').fontSize(10).text(body, { align: 'left' });
      doc.moveDown(2);
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(
          'Document généré électroniquement — signatures sur version PDF jointe ou via la plateforme.',
          {
            align: 'center',
          },
        );
      doc.end();
    });
  }

  async getByProject(projectId: string) {
    const pid = this.oid(projectId, 'projectId');
    const c = await this.contractModel
      .findOne({ projectId: pid })
      .lean()
      .exec();
    if (!c) throw new NotFoundException('Contrat introuvable.');
    return c;
  }

  /** Pour le front : pas de 404 si aucun contrat encore généré */
  async findByProjectOrNull(projectId: string) {
    const pid = this.oid(projectId, 'projectId');
    return this.contractModel.findOne({ projectId: pid }).lean().exec();
  }

  private buildContractText(args: {
    clientName: string;
    expertName: string;
    projectTitle: string;
    projectDescription: string;
    locationText: string;
    price: number;
    startDate: Date;
    completionDate: Date;
    durationDays: number;
  }) {
    const start = args.startDate.toLocaleDateString('fr-FR');
    const end = args.completionDate.toLocaleDateString('fr-FR');
    return [
      `CONTRAT DIGITAL BMP.tn`,
      ``,
      `Client: ${args.clientName}`,
      `Expert: ${args.expertName}`,
      ``,
      `Projet: ${args.projectTitle}`,
      `Description: ${args.projectDescription}`,
      `Localisation: ${args.locationText || '—'}`,
      ``,
      `Prix convenu: ${Math.round(args.price).toLocaleString('fr-FR')} TND`,
      `Durée estimée: ${args.durationDays} jours`,
      `Date de début: ${start}`,
      `Date de fin: ${end}`,
      ``,
      `Responsabilités:`,
      `- L’expert assure le suivi, les visites et la coordination technique.`,
      `- Le client facilite l’accès au site et valide les décisions nécessaires.`,
      ``,
      `Pénalités:`,
      `- En cas de retard non justifié, les parties conviennent d’un ajustement à définir d’un commun accord.`,
      ``,
      `Signatures digitales:`,
      `- Client: ______________________`,
      `- Expert: ______________________`,
      ``,
      `Généré automatiquement par BMP.tn.`,
    ].join('\n');
  }

  async acceptProposal(args: {
    proposalId: string;
    clientId: string;
    clientName?: string;
    expertName?: string;
  }) {
    const propId = this.oid(args.proposalId, 'proposalId');
    const clientId = this.oid(args.clientId, 'clientId');

    const proposal: any = await this.proposalModel
      .findById(propId)
      .lean()
      .exec();
    if (!proposal) throw new NotFoundException('Proposition introuvable.');

    if (proposal.status !== 'sent') {
      throw new BadRequestException(
        'Cette proposition ne peut pas être acceptée dans son état actuel (attendez une révision de l’expert après négociation, ou une nouvelle proposition).',
      );
    }

    const project: any = await this.projectModel
      .findById(proposal.projectId)
      .lean()
      .exec();
    if (!project) throw new NotFoundException('Projet introuvable.');
    const projClient = String(
      project.clientId?._id != null ? project.clientId._id : project.clientId,
    );
    if (projClient !== String(clientId))
      throw new ForbiddenException('Accès refusé.');

    // Un seul contrat par projet
    const existing = await this.contractModel
      .findOne({ projectId: project._id })
      .lean()
      .exec();
    if (existing) return existing;

    const startDate = clampDate(
      project.date_debut ? new Date(project.date_debut) : new Date(),
    );
    const completionDate = clampDate(
      project.date_fin_prevue ? new Date(project.date_fin_prevue) : new Date(),
    );

    const locationText = [project.ville, project.adresse]
      .filter(Boolean)
      .join(', ');
    const contractText = this.buildContractText({
      clientName: args.clientName || 'Client',
      expertName: args.expertName || 'Expert',
      projectTitle: String(project.titre || ''),
      projectDescription: String(project.description || ''),
      locationText,
      price: Number(proposal.proposedPrice || 0),
      startDate,
      completionDate,
      durationDays: Number(proposal.estimatedDurationDays || 1),
    });

    await this.proposalModel
      .findByIdAndUpdate(propId, { status: 'accepted' })
      .exec();

    const created = await this.contractModel.create({
      projectId: project._id,
      proposalId: proposal._id,
      clientId: project.clientId,
      expertId: proposal.expertId,
      projectTitle: project.titre,
      projectDescription: project.description,
      locationText,
      agreedPrice: Number(proposal.proposedPrice || 0),
      estimatedDurationDays: Number(proposal.estimatedDurationDays || 1),
      startDate,
      completionDate,
      contractText,
      status: 'pending_signatures',
    });

    await this.projectModel
      .findByIdAndUpdate(project._id, {
        expertId: proposal.expertId,
        requestStatus: 'contract_pending_signatures',
      })
      .exec();

    return created.toObject();
  }

  async getContractPdfBuffer(contractId: string, requesterUserId: string) {
    const cid = this.oid(contractId, 'contractId');
    const uid = this.oid(requesterUserId, 'userId');
    const c: any = await this.contractModel.findById(cid).lean().exec();
    if (!c) throw new NotFoundException('Contrat introuvable.');
    const isClient = this.refId(c.clientId) === String(uid);
    const isExpert = this.refId(c.expertId) === String(uid);
    if (!isClient && !isExpert) throw new ForbiddenException('Accès refusé.');
    const text = String(c.contractText || '');
    const title = `Contrat — ${String(c.projectTitle || 'Projet')}`;
    return this.buildPdfBuffer(title, text);
  }

  async uploadClientSignedPdf(
    contractId: string,
    clientUserId: string,
    file: {
      path: string;
      mimetype: string;
      size: number;
      originalname?: string;
    },
  ) {
    const cid = this.oid(contractId, 'contractId');
    const uid = this.oid(clientUserId, 'userId');
    const c: any = await this.contractModel.findById(cid).exec();
    if (!c) {
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      throw new NotFoundException('Contrat introuvable.');
    }
    if (this.refId(c.clientId) !== String(uid)) {
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      throw new ForbiddenException('Accès refusé.');
    }
    if (!this.isLikelyPdfFile(file)) {
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      throw new BadRequestException('Envoyez un fichier PDF.');
    }
    const rel = `/uploads/contracts/${file.path.split(/[/\\]/).pop()}`;
    if (c.clientSignedPdfUrl) {
      const oldAbs = join(
        process.cwd(),
        'public',
        c.clientSignedPdfUrl.replace(/^\//, ''),
      );
      try {
        if (existsSync(oldAbs)) unlinkSync(oldAbs);
      } catch {
        /* ignore */
      }
    }
    c.clientSignedPdfUrl = rel;
    if (!c.clientSignedAt) c.clientSignedAt = new Date();
    await c.save();
    return c.toObject();
  }

  async uploadExpertSignedPdf(
    contractId: string,
    expertUserId: string,
    file: {
      path: string;
      mimetype: string;
      size: number;
      originalname?: string;
    },
  ) {
    const cid = this.oid(contractId, 'contractId');
    const uid = this.oid(expertUserId, 'userId');
    const c: any = await this.contractModel.findById(cid).exec();
    if (!c) {
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      throw new NotFoundException('Contrat introuvable.');
    }
    if (this.refId(c.expertId) !== String(uid)) {
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      throw new ForbiddenException('Accès refusé.');
    }
    if (!this.isLikelyPdfFile(file)) {
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      throw new BadRequestException('Envoyez un fichier PDF.');
    }
    const rel = `/uploads/contracts/${file.path.split(/[/\\]/).pop()}`;
    if (c.expertSignedPdfUrl) {
      const oldAbs = join(
        process.cwd(),
        'public',
        c.expertSignedPdfUrl.replace(/^\//, ''),
      );
      try {
        if (existsSync(oldAbs)) unlinkSync(oldAbs);
      } catch {
        /* ignore */
      }
    }
    c.expertSignedPdfUrl = rel;
    if (!c.expertSignedAt) c.expertSignedAt = new Date();
    if (c.clientSignedAt && c.expertSignedAt) {
      c.status = 'active';
      await this.projectModel
        .findByIdAndUpdate(c.projectId, {
          requestStatus: 'active',
          statut: 'En cours',
        })
        .exec();
    }
    await c.save();
    return c.toObject();
  }

  async signContract(contractId: string, signerUserId: string) {
    const cid = this.oid(contractId, 'contractId');
    const uidRaw = String(signerUserId || '').trim();
    if (!uidRaw)
      throw new BadRequestException('Utilisateur non identifié (x-user-id).');
    const uid = this.oid(uidRaw, 'userId');
    const c: any = await this.contractModel.findById(cid).exec();
    if (!c) throw new NotFoundException('Contrat introuvable.');

    const now = new Date();
    const isClient = this.refId(c.clientId) === String(uid);
    const isExpert = this.refId(c.expertId) === String(uid);
    if (!isClient && !isExpert) throw new ForbiddenException('Accès refusé.');

    if (isClient && !c.clientSignedAt) c.clientSignedAt = now;
    if (isExpert && !c.expertSignedAt) c.expertSignedAt = now;

    if (c.clientSignedAt && c.expertSignedAt) {
      c.status = 'active';
      await this.projectModel
        .findByIdAndUpdate(c.projectId, {
          requestStatus: 'active',
          statut: 'En cours',
        })
        .exec();
    }

    await c.save();
    return c.toObject();
  }
}
