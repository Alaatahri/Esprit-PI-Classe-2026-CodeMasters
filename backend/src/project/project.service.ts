import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(createProjectDto: Partial<Project>): Promise<Project> {
    const createdProject = new this.projectModel(createProjectDto);
    return createdProject.save();
  }

  async findAll(limit = 100): Promise<Project[]> {
    return this.projectModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  /** Projets en attente sans expert assigné (pour matching auto). */
  async findPendingWithoutExpert(limit = 200): Promise<Array<{ _id: string }>> {
    const list: any[] = await this.projectModel
      .find({ statut: 'En attente', expertId: { $exists: false } })
      .select('_id')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return list.map((p) => ({ _id: String(p._id) }));
  }

  /** Dossiers dont l’utilisateur est l’expert référent. */
  async findByExpertId(expertId: string): Promise<Project[]> {
    if (!this.isValidObjectId(expertId)) {
      throw new BadRequestException('ID expert invalide.');
    }
    const oid = new Types.ObjectId(expertId);
    return this.projectModel
      .find({ expertId: oid })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(200)
      .lean()
      .exec();
  }

  /** Projets liés à un membre pour la fiche profil publique (expert référent ou artisan candidat). */
  async findProjectsForPublicProfile(
    userId: string,
    role: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isValidObjectId(userId)) {
      return [];
    }
    const oid = new Types.ObjectId(userId);
    if (role === 'expert') {
      return this.projectModel
        .find({ expertId: oid })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
        .lean()
        .exec();
    }
    if (role === 'artisan') {
      return this.projectModel
        .find({ 'applications.artisanId': oid })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
        .lean()
        .exec();
    }
    return [];
  }

  async findOne(id: string): Promise<Project> {
    return this.projectModel.findById(id).lean().exec();
  }

  /** Vitrine : projets visibles (terminés ou en cours). */
  async findPublicShowcase(): Promise<Record<string, unknown>[]> {
    const projects = await this.projectModel
      .find({ statut: { $in: ['Terminé', 'En cours'] } })
      .select(
        'titre description statut avancement_global clientRating clientComment expertRating artisanRating photosAvant photosApres updatedAt createdAt',
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(24)
      .lean()
      .exec();

    return projects.map((p: any) => ({
      _id: p._id?.toString?.() ?? String(p._id),
      titre: p.titre,
      description: p.description,
      statut: p.statut,
      avancement_global: p.avancement_global,
      clientRating: p.clientRating,
      clientComment: p.clientComment,
      expertRating: p.expertRating,
      artisanRating: p.artisanRating,
      photosAvant: p.photosAvant ?? [],
      photosApres: p.photosApres ?? [],
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }));
  }

  async findPublicShowcaseById(id: string): Promise<Record<string, unknown>> {
    if (!this.isValidObjectId(id)) {
      throw new NotFoundException('Projet introuvable.');
    }
    const p: any = await this.projectModel
      .findById(id)
      .select(
        'titre description statut avancement_global clientRating clientComment expertRating artisanRating expertComment artisanComment photosAvant photosApres reviews chantierPhotos updatedAt createdAt',
      )
      .lean()
      .exec();
    if (!p) {
      throw new NotFoundException('Projet introuvable.');
    }
    return {
      _id: p._id?.toString?.() ?? String(p._id),
      titre: p.titre,
      description: p.description,
      statut: p.statut,
      avancement_global: p.avancement_global,
      clientRating: p.clientRating,
      clientComment: p.clientComment,
      expertRating: p.expertRating,
      artisanRating: p.artisanRating,
      expertComment: p.expertComment,
      artisanComment: p.artisanComment,
      photosAvant: p.photosAvant ?? [],
      photosApres: p.photosApres ?? [],
      reviews: p.reviews ?? [],
      chantierPhotos: p.chantierPhotos ?? [],
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    };
  }

  async update(id: string, updateProjectDto: Partial<Project>): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Project> {
    return this.projectModel.findByIdAndDelete(id).exec();
  }

  async updateStatusAndProgress(id: string, avancement: number): Promise<Project> {
    let statut: string;
    if (avancement === 0) {
      statut = 'En attente';
    } else if (avancement === 100) {
      statut = 'Terminé';
    } else {
      statut = 'En cours';
    }

    return this.projectModel.findByIdAndUpdate(
      id,
      { avancement_global: avancement, statut },
      { new: true }
    ).exec();
  }

  async assignExpert(projectId: string, expertUserId: string): Promise<void> {
    if (!this.isValidObjectId(projectId) || !this.isValidObjectId(expertUserId)) {
      throw new BadRequestException('Identifiant invalide.');
    }
    await this.projectModel
      .findByIdAndUpdate(projectId, {
        expertId: new Types.ObjectId(expertUserId),
      })
      .exec();
  }

  async assertExpertAndUpdateProgress(
    projectId: string,
    expertUserId: string,
    avancement: number,
  ): Promise<Project> {
    const project: any = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }
    const eid = project.expertId?.toString?.();
    if (!eid || eid !== expertUserId) {
      throw new ForbiddenException(
        "Seul l'expert assigné peut mettre à jour l'avancement.",
      );
    }
    return this.updateStatusAndProgress(projectId, avancement);
  }

  async applyToProject(projectId: string, artisanId: string) {
    if (!this.isValidObjectId(projectId)) {
      throw new BadRequestException('ID de projet invalide.');
    }

    if (!this.isValidObjectId(artisanId)) {
      throw new BadRequestException('ID artisan invalide.');
    }

    const project: any = await this.projectModel.findById(projectId).exec();

    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }

    const hasAlreadyApplied = (project.applications || []).some(
      (application: any) =>
        application?.artisanId?.toString?.() === artisanId &&
        application?.statut !== 'refusee',
    );

    if (hasAlreadyApplied) {
      throw new BadRequestException('Vous avez déjà postulé à ce projet.');
    }

    project.applications = project.applications || [];
    project.applications.push({
      artisanId: new Types.ObjectId(artisanId),
      statut: 'en_attente',
      createdAt: new Date(),
    });

    await project.save();

    const createdApplication = project.applications[project.applications.length - 1];

    return {
      _id: createdApplication?._id?.toString?.() ?? createdApplication?._id,
      projet: {
        _id: project._id?.toString?.() ?? project._id,
        titre: project.titre,
      },
      statut: createdApplication?.statut,
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    statut: 'en_attente' | 'acceptee' | 'refusee',
  ) {
    if (!this.isValidObjectId(applicationId)) {
      throw new BadRequestException('ID de candidature invalide.');
    }

    const applicationObjectId = new Types.ObjectId(applicationId);
    const project: any = await this.projectModel
      .findOne({ 'applications._id': applicationObjectId })
      .exec();

    if (!project) {
      throw new NotFoundException('Candidature introuvable.');
    }

    const application = (project.applications || []).find(
      (item: any) => item?._id?.toString?.() === applicationId,
    );

    if (!application) {
      throw new NotFoundException('Candidature introuvable.');
    }

    application.statut = statut;
    await project.save();

    return {
      _id: application?._id?.toString?.() ?? application?._id,
      projet: {
        _id: project._id?.toString?.() ?? project._id,
        titre: project.titre,
      },
      statut: application.statut,
    };
  }

  async findApplicationsForArtisan(artisanId: string) {
    if (!this.isValidObjectId(artisanId)) {
      throw new BadRequestException('ID artisan invalide.');
    }

    const artisanObjectId = new Types.ObjectId(artisanId);
    const projects: any[] = await this.projectModel
      .find({ 'applications.artisanId': artisanObjectId })
      .lean()
      .exec();

    const applications = projects.flatMap((project: any) =>
      (project.applications || [])
        .filter(
          (application: any) =>
            application?.artisanId?.toString?.() === artisanId,
        )
        .map((application: any) => ({
          _id: application?._id?.toString?.() ?? application?._id,
          projet: {
            _id: project?._id?.toString?.() ?? project?._id,
            titre: project?.titre,
          },
          statut: application?.statut,
          createdAt: application?.createdAt,
        })),
    );

    return applications;
  }
}
