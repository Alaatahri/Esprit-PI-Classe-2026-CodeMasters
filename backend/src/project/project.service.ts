import {
  BadRequestException,
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

  async findOne(id: string): Promise<Project> {
    return this.projectModel.findById(id).lean().exec();
  }

  /** Vitrine : projets visibles (terminés ou en cours). */
  async findPublicShowcase(): Promise<Record<string, unknown>[]> {
    const projects = await this.projectModel
      .find({ statut: { $in: ['Terminé', 'En cours'] } })
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
    const p: any = await this.projectModel.findById(id).lean().exec();
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
