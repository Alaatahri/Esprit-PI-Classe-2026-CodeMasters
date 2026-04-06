import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../project/schemas/project.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import {
  MatchingRequest,
  MatchingRequestDocument,
} from './schemas/matching-request.schema';
import { analyzeProject } from './services/projectAnalysisService';
import { findBestExperts } from './services/matchingService';
import {
  Proposal,
  ProposalDocument,
} from '../proposals/schemas/proposal.schema';
import { toPlainJson } from '../common/mongo-json.util';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectModel(MatchingRequest.name)
    private matchingRequestModel: Model<MatchingRequestDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Proposal.name) private proposalModel: Model<ProposalDocument>,
  ) {}

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async assertRole(userId: string, role: 'admin' | 'expert') {
    if (!this.isValidObjectId(userId)) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    const user: any = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new ForbiddenException('Utilisateur non authentifié');
    const r = String(user.role ?? '')
      .trim()
      .toLowerCase();
    if (r !== role) throw new ForbiddenException('Accès interdit');
    return user;
  }

  private async expirePendingRequestsForProject(
    projectId: string,
    now = new Date(),
  ) {
    if (!this.isValidObjectId(projectId)) return;
    await this.matchingRequestModel
      .updateMany(
        {
          projectId: new Types.ObjectId(projectId),
          status: 'pending',
          expiresAt: { $lte: now },
        },
        { $set: { status: 'refused', respondedAt: now } },
      )
      .exec();
  }

  async triggerMatching(projectId: string) {
    if (!this.isValidObjectId(projectId)) {
      throw new BadRequestException('ID projet invalide');
    }

    const now = new Date();

    // On n’empêche pas le rerun si des invitations pending existent.
    // Le service va juste ajouter des experts additionnels (sans dupliquer).
    await this.expirePendingRequestsForProject(projectId, now);

    const project: any = await this.projectModel.findById(projectId).exec();
    if (!project) throw new NotFoundException('Projet introuvable');

    let analysis: {
      complexity: 'simple' | 'medium' | 'complex';
      requiredCompetences: string[];
    };
    try {
      analysis = await analyzeProject(
        `${project.titre ?? ''}\n${project.description ?? ''}`,
      );
    } catch (e: any) {
      throw new BadRequestException(e?.message || String(e));
    }

    // Sauvegarde optionnelle si les champs existent sur le schema
    const schema: any = (this.projectModel as any)?.schema;
    const canSetRequired = !!schema?.path?.('requiredCompetences');
    const canSetComplexity = !!schema?.path?.('complexity');
    if (canSetRequired)
      project.requiredCompetences = analysis.requiredCompetences;
    if (canSetComplexity) project.complexity = analysis.complexity;
    if (canSetRequired || canSetComplexity) await project.save();

    const alreadyInvited = await this.matchingRequestModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .select('expertId')
      .lean()
      .exec();
    const excluded = new Set<string>(
      (alreadyInvited || [])
        .map((r: any) => r?.expertId?.toString?.())
        .filter(Boolean),
    );

    /** Nombre d’invitations par projet (élargi pour que plus d’experts voient « Nouveaux projets »). */
    const targetInviteCount = 25;
    const candidatePool = 80;

    const candidates = await findBestExperts(
      analysis.requiredCompetences,
      this.userModel as any,
      candidatePool,
    );

    let matchedExperts: any[] = candidates
      .filter((e: any) => !excluded.has(e?._id?.toString?.()))
      .slice(0, targetInviteCount);

    const pickedIds = new Set(
      matchedExperts.map((e: any) => e?._id?.toString?.()).filter(Boolean),
    );

    // Compléter avec d’autres experts disponibles (note / exp.) tant qu’il reste des places.
    // Avant : seulement 8 invités « au mieux matchant » → beaucoup d’experts ne voyaient jamais l’invitation.
    if (matchedExperts.length < targetInviteCount) {
      const need = targetInviteCount - matchedExperts.length;
      const ninIds = [
        ...Array.from(excluded)
          .filter(Boolean)
          .map((x) => new Types.ObjectId(x)),
        ...Array.from(pickedIds).map((x) => new Types.ObjectId(x)),
      ];
      const fallback: any[] = await this.userModel
        .find({
          role: 'expert',
          $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }],
          ...(ninIds.length ? { _id: { $nin: ninIds } } : {}),
        })
        .select(
          'prenom nom email competences rating experienceYears isAvailable',
        )
        .lean()
        .exec();

      const extra = (fallback || [])
        .sort((a: any, b: any) => {
          const ra = Number(a?.rating ?? 0);
          const rb = Number(b?.rating ?? 0);
          if (rb !== ra) return rb - ra;
          const ea = Number(a?.experienceYears ?? 0);
          const eb = Number(b?.experienceYears ?? 0);
          return eb - ea;
        })
        .slice(0, need)
        .map((e: any) => ({
          _id: e._id,
          prenom: e.prenom,
          nom: e.nom,
          email: e.email,
          competences: e.competences,
          isAvailable: e.isAvailable,
          rating: e.rating,
          experienceYears: e.experienceYears,
          score: matchedExperts.length === 0 ? 10 : 5,
        }));

      matchedExperts = [...matchedExperts, ...extra];
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const docs = matchedExperts.map((expert: any) => ({
      projectId: new Types.ObjectId(projectId),
      expertId: new Types.ObjectId(expert._id),
      matchScore: expert.score,
      requiredCompetences: analysis.requiredCompetences,
      status: 'pending' as const,
      sentAt: new Date(),
      expiresAt,
    }));

    if (docs.length > 0) {
      try {
        await this.matchingRequestModel.insertMany(docs, { ordered: false });
      } catch {
        // ignore duplicate inserts
      }
    }

    return {
      complexity: analysis.complexity,
      requiredCompetences: analysis.requiredCompetences,
      matchedExperts,
    };
  }

  async listAllRequests() {
    const now = new Date();
    const rows: any[] = await this.matchingRequestModel
      .find()
      .sort({ sentAt: -1 })
      .populate('expertId', 'prenom nom email competences rating')
      .populate('projectId', 'titre nom description')
      .lean()
      .exec();

    return (rows || []).map((r: any) => ({
      ...r,
      isExpired:
        r?.status === 'pending' && r?.expiresAt && new Date(r.expiresAt) <= now,
    }));
  }

  async listMyRequests(expertId: string) {
    if (!this.isValidObjectId(expertId)) return [];
    const now = new Date();
    const rows: any[] = await this.matchingRequestModel
      .find({ expertId: new Types.ObjectId(expertId) })
      .sort({ sentAt: -1 })
      .populate({
        path: 'projectId',
        select:
          'titre description ville categorie urgence adresse surface_m2 type_batiment budget_estime budget_min budget_max date_debut date_fin_prevue statut requestStatus clientId expertId createdAt',
        populate: {
          path: 'expertId',
          select: 'prenom nom email',
        },
      })
      .populate('expertId', 'prenom nom email')
      .lean()
      .exec();

    return (rows || []).map((r: any) => ({
      ...r,
      isExpired:
        r?.status === 'pending' && r?.expiresAt && new Date(r.expiresAt) <= now,
    }));
  }

  /** Détail d’une demande de matching pour l’expert connecté (même invitation). */
  async getMyRequestById(requestId: string, expertId: string) {
    if (!this.isValidObjectId(requestId) || !this.isValidObjectId(expertId)) {
      throw new BadRequestException('ID invalide');
    }

    const reqRow: any = await this.matchingRequestModel
      .findOne({
        _id: new Types.ObjectId(requestId),
        expertId: new Types.ObjectId(expertId),
      })
      .populate(
        'expertId',
        'prenom nom email competences rating experienceYears',
      )
      .lean()
      .exec();

    if (!reqRow) {
      throw new NotFoundException('Demande introuvable');
    }

    const project: any = await this.projectModel
      .findById(reqRow.projectId)
      .populate('clientId', 'prenom nom email telephone role')
      .populate('expertId', 'prenom nom email telephone')
      .lean()
      .exec();

    return {
      request: reqRow,
      project: project || null,
    };
  }

  async respondToRequest(
    requestId: string,
    expertId: string,
    response: 'accepted' | 'refused',
  ) {
    if (!this.isValidObjectId(requestId)) {
      throw new BadRequestException('ID request invalide');
    }
    if (!this.isValidObjectId(expertId)) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    if (response !== 'accepted' && response !== 'refused') {
      throw new BadRequestException(
        'response doit être "accepted" ou "refused"',
      );
    }

    const reqDoc: any = await this.matchingRequestModel
      .findById(requestId)
      .exec();
    if (!reqDoc) throw new NotFoundException('Demande introuvable');
    if (reqDoc.expertId?.toString?.() !== expertId)
      throw new ForbiddenException('Accès interdit');
    if (reqDoc.status !== 'pending')
      throw new BadRequestException('Request already answered');

    if (reqDoc.expiresAt && new Date(reqDoc.expiresAt) <= new Date()) {
      reqDoc.status = 'refused';
      reqDoc.respondedAt = new Date();
      await reqDoc.save();
      throw new BadRequestException(
        "Invitation expirée (24h). Le matching sera relancé avec d'autres profils.",
      );
    }

    reqDoc.status = response;
    reqDoc.respondedAt = new Date();
    await reqDoc.save();

    if (response === 'accepted') {
      const projectSchema: any = (this.projectModel as any)?.schema;
      const hasExpertsArray = !!projectSchema?.path?.('experts');
      const hasTeamArray = !!projectSchema?.path?.('team');
      const hasExpertId = !!projectSchema?.path?.('expertId');

      if (hasExpertsArray) {
        await this.projectModel
          .findByIdAndUpdate(reqDoc.projectId, {
            $addToSet: { experts: new Types.ObjectId(expertId) },
          })
          .exec();
      } else if (hasTeamArray) {
        await this.projectModel
          .findByIdAndUpdate(reqDoc.projectId, {
            $addToSet: { team: new Types.ObjectId(expertId) },
          })
          .exec();
      } else if (hasExpertId) {
        await this.projectModel
          .findByIdAndUpdate(reqDoc.projectId, {
            expertId: new Types.ObjectId(expertId),
          })
          .exec();
      }
    }

    return reqDoc.toObject();
  }

  /** Experts et administrateurs : vue globale de tous les dossiers projets. */
  async assertExpertOrAdmin(userId: string) {
    if (!this.isValidObjectId(userId)) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    const user: any = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new ForbiddenException('Utilisateur non authentifié');
    const role = String(user.role ?? '')
      .trim()
      .toLowerCase();
    if (role !== 'expert' && role !== 'admin') {
      throw new ForbiddenException(
        'Accès réservé aux experts et administrateurs',
      );
    }
    return user;
  }

  async getExpertProjectCatalog(userId: string) {
    try {
      await this.assertExpertOrAdmin(userId);

      let projects: any[];
      try {
        projects = await this.projectModel
          .find()
          .sort({ createdAt: -1 })
          .limit(200)
          .populate('clientId', 'prenom nom email telephone role')
          .populate('expertId', 'prenom nom email telephone role')
          .lean()
          .exec();
      } catch (err) {
        this.logger.warn(
          `Catalogue: populate projet échoué (${err instanceof Error ? err.message : String(err)}), repli sans jointure`,
        );
        projects = await this.projectModel
          .find()
          .sort({ createdAt: -1 })
          .limit(200)
          .lean()
          .exec();
      }

      if (!projects.length) return [];

      const pids = projects.map((p) => p._id);

      let allReqs: any[];
      try {
        allReqs = await this.matchingRequestModel
          .find({ projectId: { $in: pids } })
          .populate('expertId', 'prenom nom email role')
          .lean()
          .exec();
      } catch (err) {
        this.logger.warn(
          `Catalogue: populate matching échoué (${err instanceof Error ? err.message : String(err)}), repli sans jointure`,
        );
        allReqs = await this.matchingRequestModel
          .find({ projectId: { $in: pids } })
          .lean()
          .exec();
      }

      const grouped = new Map<string, any[]>();
      for (const r of allReqs) {
        const pid = String(r.projectId);
        if (!grouped.has(pid)) grouped.set(pid, []);
        grouped.get(pid)!.push(r);
      }

      const rows = projects.map((p) => {
        const pid = String(p._id);
        const reqs = grouped.get(pid) ?? [];
        const accepted = reqs.find((x: any) => x.status === 'accepted');
        const pending = reqs.filter((x: any) => x.status === 'pending').length;
        const refused = reqs.filter((x: any) => x.status === 'refused').length;
        return {
          project: p,
          matching: {
            inviteCount: reqs.length,
            pending,
            refused,
            acceptedBy: accepted
              ? {
                  requestId: accepted._id,
                  respondedAt: accepted.respondedAt,
                  expert: accepted.expertId,
                }
              : null,
          },
        };
      });

      return toPlainJson(rows);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('getExpertProjectCatalog', err);
      throw new ServiceUnavailableException(
        'Impossible de lire les projets. Vérifiez que MongoDB est démarré et que MONGODB_URI est correct.',
      );
    }
  }

  /** Rapport détaillé : projet + invitations matching + propositions. */
  async getExpertProjectReport(projectId: string, userId: string) {
    try {
      await this.assertExpertOrAdmin(userId);
      if (!this.isValidObjectId(projectId)) {
        throw new BadRequestException('ID projet invalide');
      }

      let project: any;
      try {
        project = await this.projectModel
          .findById(projectId)
          .populate('clientId', 'prenom nom email telephone role')
          .populate('expertId', 'prenom nom email telephone role competences')
          .lean()
          .exec();
      } catch (err) {
        this.logger.warn(
          `Rapport: populate projet échoué (${err instanceof Error ? err.message : String(err)}), repli sans jointure`,
        );
        project = await this.projectModel.findById(projectId).lean().exec();
      }

      if (!project) throw new NotFoundException('Projet introuvable');

      let matchingRequests: any[];
      try {
        matchingRequests = await this.matchingRequestModel
          .find({ projectId: new Types.ObjectId(projectId) })
          .sort({ sentAt: -1 })
          .populate(
            'expertId',
            'prenom nom email telephone role competences rating experienceYears',
          )
          .lean()
          .exec();
      } catch (err) {
        this.logger.warn(
          `Rapport: populate matching échoué (${err instanceof Error ? err.message : String(err)}), repli sans jointure`,
        );
        matchingRequests = await this.matchingRequestModel
          .find({ projectId: new Types.ObjectId(projectId) })
          .sort({ sentAt: -1 })
          .lean()
          .exec();
      }

      let proposals: any[];
      try {
        proposals = await this.proposalModel
          .find({ projectId: new Types.ObjectId(projectId) })
          .sort({ createdAt: -1 })
          .populate('expertId', 'prenom nom email role')
          .lean()
          .exec();
      } catch (err) {
        this.logger.warn(
          `Rapport: populate propositions échoué (${err instanceof Error ? err.message : String(err)}), repli sans jointure`,
        );
        proposals = await this.proposalModel
          .find({ projectId: new Types.ObjectId(projectId) })
          .sort({ createdAt: -1 })
          .lean()
          .exec();
      }

      return toPlainJson({ project, matchingRequests, proposals });
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('getExpertProjectReport', err);
      throw new ServiceUnavailableException(
        'Impossible de lire le rapport. Vérifiez que MongoDB est démarré et que MONGODB_URI est correct.',
      );
    }
  }
}
