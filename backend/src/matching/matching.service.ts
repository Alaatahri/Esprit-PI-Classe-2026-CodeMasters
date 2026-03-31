import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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

@Injectable()
export class MatchingService {
  constructor(
    @InjectModel(MatchingRequest.name)
    private matchingRequestModel: Model<MatchingRequestDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
    if (user.role !== role) throw new ForbiddenException('Accès interdit');
    return user;
  }

  private async expirePendingRequestsForProject(projectId: string, now = new Date()) {
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
    const activePending = await this.matchingRequestModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        status: 'pending',
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
      })
      .lean()
      .exec();
    if (activePending) {
      throw new BadRequestException(
        'Matching en cours pour ce projet (invitation encore valide)',
      );
    }

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
    if (canSetRequired) project.requiredCompetences = analysis.requiredCompetences;
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

    const candidates = await findBestExperts(
      analysis.requiredCompetences,
      this.userModel as any,
      25,
    );
    const matchedExperts = candidates
      .filter((e: any) => !excluded.has(e?._id?.toString?.()))
      .slice(0, 5);

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
        r?.status === 'pending' &&
        r?.expiresAt &&
        new Date(r.expiresAt) <= now,
    }));
  }

  async listMyRequests(expertId: string) {
    if (!this.isValidObjectId(expertId)) return [];
    const now = new Date();
    const rows: any[] = await this.matchingRequestModel
      .find({ expertId: new Types.ObjectId(expertId) })
      .sort({ sentAt: -1 })
      .populate('projectId', 'titre nom description')
      .lean()
      .exec();

    return (rows || []).map((r: any) => ({
      ...r,
      isExpired:
        r?.status === 'pending' &&
        r?.expiresAt &&
        new Date(r.expiresAt) <= now,
    }));
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
      throw new BadRequestException('response doit être "accepted" ou "refused"');
    }

    const reqDoc: any = await this.matchingRequestModel.findById(requestId).exec();
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
}

