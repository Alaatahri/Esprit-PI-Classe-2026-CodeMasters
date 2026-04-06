import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { SuiviProjectService } from '../suivi-project/suivi-project.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => SuiviProjectService))
    private readonly suiviProjectService: SuiviProjectService,
  ) {}

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(createProjectDto: Partial<Project>): Promise<Project> {
    // Compat: les nouveaux formulaires client ne fournissent plus date/budget.
    // On met des valeurs provisoires, l’expert proposera ensuite via proposition/contrat.
    const dto: any = { ...(createProjectDto as any) };
    if (!dto.date_debut) dto.date_debut = new Date();
    if (!dto.date_fin_prevue)
      dto.date_fin_prevue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (dto.budget_estime == null) dto.budget_estime = 0;
    const createdProject = new this.projectModel(dto);
    return createdProject.save();
  }

  async findAll(limit = 100): Promise<Project[]> {
    return this.projectModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    return this.projectModel.findById(id).lean().exec();
  }

  async findCompletedByClient(
    clientId: string,
    limit = 100,
  ): Promise<Project[]> {
    return this.projectModel
      .find({ clientId, statut: 'Terminé' })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findAcceptedByArtisan(
    artisanId: string,
    limit = 100,
  ): Promise<Project[]> {
    if (!this.isValidObjectId(artisanId)) {
      throw new BadRequestException('ID artisan invalide.');
    }

    const artisanObjectId = new Types.ObjectId(artisanId);
    return this.projectModel
      .find({
        applications: {
          $elemMatch: {
            artisanId: artisanObjectId,
            statut: 'acceptee',
          },
        },
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findCompletedByArtisan(
    artisanId: string,
    limit = 100,
  ): Promise<Project[]> {
    if (!this.isValidObjectId(artisanId)) {
      throw new BadRequestException('ID artisan invalide.');
    }

    const artisanObjectId = new Types.ObjectId(artisanId);
    return this.projectModel
      .find({
        statut: 'Terminé',
        applications: {
          $elemMatch: {
            artisanId: artisanObjectId,
            statut: 'acceptee',
          },
        },
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findByExpertId(expertId: string, limit = 100): Promise<Project[]> {
    if (!this.isValidObjectId(expertId)) {
      throw new BadRequestException('ID expert invalide.');
    }
    return this.projectModel
      .find({ expertId: new Types.ObjectId(expertId) })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /** Projets terminés pour la vitrine publique (sans données sensibles côté contrôleur). */
  async findShowcaseProjects(limit = 24): Promise<Project[]> {
    return this.projectModel
      .find({ statut: 'Terminé' })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select(
        '_id titre description statut avancement_global clientRating clientComment photosAvant photosApres updatedAt createdAt',
      )
      .lean()
      .exec();
  }

  /** Détail public d’un projet terminé (galerie avant/après, avis, photos chantier). */
  async findPublicShowcaseById(id: string) {
    if (!this.isValidObjectId(id)) {
      throw new NotFoundException('Projet introuvable');
    }
    const p = await this.projectModel.findById(id).lean().exec();
    if (!p || p.statut !== 'Terminé') {
      throw new NotFoundException('Projet introuvable');
    }
    const doc = p as any;
    const photosAvant = Array.isArray(doc.photosAvant) ? doc.photosAvant : [];
    const photosApres = Array.isArray(doc.photosApres) ? doc.photosApres : [];

    const reviews: Array<{
      text: string;
      rating?: number;
      author: string;
      role: string;
    }> = [];

    const clientText =
      typeof doc.clientComment === 'string' ? doc.clientComment.trim() : '';
    if (clientText) {
      reviews.push({
        text: clientText,
        rating:
          typeof doc.clientRating === 'number' ? doc.clientRating : undefined,
        author: 'Client',
        role: 'client',
      });
    }

    if (typeof doc.expertRating === 'number') {
      const expertText =
        typeof doc.expertComment === 'string' && doc.expertComment.trim()
          ? doc.expertComment.trim()
          : 'Accompagnement technique, visites de contrôle et validation des lots conformes au dossier.';
      reviews.push({
        text: expertText,
        rating: doc.expertRating,
        author: 'Expert BMP.tn',
        role: 'expert',
      });
    }

    if (typeof doc.artisanRating === 'number') {
      const artisanText =
        typeof doc.artisanComment === 'string' && doc.artisanComment.trim()
          ? doc.artisanComment.trim()
          : 'Réalisation des travaux dans le respect du planning, de la sécurité et des finitions convenues.';
      reviews.push({
        text: artisanText,
        rating: doc.artisanRating,
        author: 'Équipe artisan',
        role: 'artisan',
      });
    }

    const extra = Array.isArray(doc.showcaseReviews) ? doc.showcaseReviews : [];
    for (const r of extra) {
      const t = typeof r?.text === 'string' ? r.text.trim() : '';
      if (!t) continue;
      reviews.push({
        text: t,
        rating: typeof r.rating === 'number' ? r.rating : undefined,
        author:
          typeof r.author === 'string' && r.author.trim()
            ? r.author.trim()
            : 'Visiteur',
        role: typeof r.role === 'string' ? r.role : 'visiteur',
      });
    }

    let chantierPhotos: string[] = [];
    try {
      chantierPhotos =
        await this.suiviProjectService.findPublicPhotoUrlsForProject(id);
    } catch {
      chantierPhotos = [];
    }

    return {
      _id: doc._id,
      titre: doc.titre,
      description: doc.description,
      statut: doc.statut,
      avancement_global: doc.avancement_global,
      clientRating: doc.clientRating,
      clientComment: doc.clientComment,
      expertRating: doc.expertRating,
      artisanRating: doc.artisanRating,
      expertComment: doc.expertComment,
      artisanComment: doc.artisanComment,
      photosAvant,
      photosApres,
      reviews,
      chantierPhotos,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    };
  }

  async update(
    id: string,
    updateProjectDto: Partial<Project>,
  ): Promise<Project> {
    return this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .exec();
  }

  /**
   * L’expert assigné enrichit les galeries « avant / après » du projet (URLs publiques).
   */
  async appendExpertProjectPhotos(
    projectId: string,
    expertId: string,
    dto: { urls: string[]; album: 'avant' | 'apres' },
  ): Promise<Project> {
    if (!this.isValidObjectId(projectId) || !this.isValidObjectId(expertId)) {
      throw new BadRequestException('Identifiants invalides.');
    }
    const project: any = await this.projectModel
      .findById(projectId)
      .lean()
      .exec();
    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }
    const assigned = project.expertId?.toString?.();
    if (!assigned || assigned !== expertId) {
      throw new ForbiddenException(
        'Seul l’expert assigné à ce projet peut y ajouter des photos.',
      );
    }
    const clean = dto.urls
      .map((u) => String(u).trim())
      .filter((u) => /^https?:\/\//i.test(u));
    if (clean.length === 0) {
      throw new BadRequestException(
        'Au moins une URL http(s) valide est requise.',
      );
    }
    const maxAdd = 24;
    const slice = clean.slice(0, maxAdd);
    const field = dto.album === 'avant' ? 'photosAvant' : 'photosApres';
    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $push: { [field]: { $each: slice } } } as Record<string, unknown>,
        { new: true },
      )
      .lean()
      .exec();
    return updated as Project;
  }

  /** Note de suivi / feedback par l’expert assigné */
  async setExpertProjectFeedback(
    projectId: string,
    expertId: string,
    text: string,
  ): Promise<Project> {
    if (!this.isValidObjectId(projectId) || !this.isValidObjectId(expertId)) {
      throw new BadRequestException('Identifiants invalides.');
    }
    const project: any = await this.projectModel
      .findById(projectId)
      .lean()
      .exec();
    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }
    const assigned = project.expertId?.toString?.();
    if (!assigned || assigned !== expertId) {
      throw new ForbiddenException(
        'Seul l’expert assigné à ce projet peut enregistrer un feedback.',
      );
    }
    const t = String(text ?? '').trim();
    if (!t) {
      throw new BadRequestException('Le texte du feedback est requis.');
    }
    if (t.length > 12000) {
      throw new BadRequestException(
        'Feedback trop long (max 12000 caractères).',
      );
    }
    const updated = await this.projectModel
      .findByIdAndUpdate(projectId, { expertFeedback: t }, { new: true })
      .lean()
      .exec();
    return updated as Project;
  }

  /**
   * Ajoute des fichiers uploadés (URLs) à la demande de projet.
   * `kind`:
   * - attachment -> `pieces_jointes`
   * - site_photo -> `photos_site`
   *
   * Autorisation: propriétaire (clientId) uniquement.
   */
  async appendProjectRequestUploads(
    projectId: string,
    userId: string,
    dto: { kind: 'attachment' | 'site_photo'; urls: string[] },
  ) {
    if (!this.isValidObjectId(projectId) || !this.isValidObjectId(userId)) {
      throw new BadRequestException('Identifiants invalides.');
    }
    const p: any = await this.projectModel.findById(projectId).lean().exec();
    if (!p) throw new NotFoundException('Projet introuvable.');
    if (String(p.clientId) !== String(userId)) {
      throw new ForbiddenException(
        'Seul le client propriétaire peut ajouter des fichiers.',
      );
    }
    const clean = (dto.urls || [])
      .map((u) => String(u).trim())
      .filter((u) => /^https?:\/\//i.test(u));
    if (clean.length === 0) {
      throw new BadRequestException('Aucune URL valide.');
    }
    const field = dto.kind === 'site_photo' ? 'photos_site' : 'pieces_jointes';
    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $push: { [field]: { $each: clean.slice(0, 24) } } } as Record<
          string,
          unknown
        >,
        { new: true },
      )
      .lean()
      .exec();
    return updated as Project;
  }

  async rateProject(
    id: string,
    rating: {
      clientRating?: number;
      clientComment?: string;
      expertRating?: number;
      artisanRating?: number;
    },
  ): Promise<Project> {
    const update: Partial<Project> = {};

    if (typeof rating.clientRating === 'number') {
      update.clientRating = Math.max(1, Math.min(5, rating.clientRating));
    }

    if (typeof rating.expertRating === 'number') {
      update.expertRating = Math.max(1, Math.min(5, rating.expertRating));
    }

    if (typeof rating.artisanRating === 'number') {
      update.artisanRating = Math.max(1, Math.min(5, rating.artisanRating));
    }

    if (typeof rating.clientComment === 'string') {
      update.clientComment = rating.clientComment.trim();
    }

    return this.projectModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean()
      .exec();
  }

  async remove(id: string): Promise<Project> {
    return this.projectModel.findByIdAndDelete(id).exec();
  }

  async updateStatusAndProgress(
    id: string,
    avancement: number,
  ): Promise<Project> {
    let statut: string;
    if (avancement === 0) {
      statut = 'En attente';
    } else if (avancement === 100) {
      statut = 'Terminé';
    } else {
      statut = 'En cours';
    }

    return this.projectModel
      .findByIdAndUpdate(
        id,
        { avancement_global: avancement, statut },
        { new: true },
      )
      .exec();
  }

  /** Client propriétaire : annule la demande / le dossier */
  async cancelByClient(projectId: string, clientId: string): Promise<Project> {
    if (!this.isValidObjectId(projectId) || !this.isValidObjectId(clientId)) {
      throw new BadRequestException('Identifiants invalides.');
    }
    const p: any = await this.projectModel.findById(projectId).lean().exec();
    if (!p) throw new NotFoundException('Projet introuvable.');
    const cid = String(p.clientId?._id != null ? p.clientId._id : p.clientId);
    if (cid !== String(clientId)) {
      throw new ForbiddenException(
        'Seul le client propriétaire peut annuler ce projet.',
      );
    }
    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { requestStatus: 'cancelled' },
        { new: true },
      )
      .lean()
      .exec();
    return updated as Project;
  }

  /**
   * Expert assigné : saisie manuelle de l’avancement (sans photo).
   * Crée une ligne de suivi et met à jour `avancement_global`.
   */
  async recordExpertManualProgress(
    projectId: string,
    expertId: string,
    avancement: number,
    note?: string,
  ): Promise<Project> {
    if (!this.isValidObjectId(projectId) || !this.isValidObjectId(expertId)) {
      throw new BadRequestException('Identifiants invalides.');
    }
    const project: any = await this.projectModel
      .findById(projectId)
      .lean()
      .exec();
    if (!project) throw new NotFoundException('Projet introuvable.');
    const assigned = project?.expertId?.toString?.();
    if (!assigned || assigned !== expertId) {
      throw new ForbiddenException(
        'Seul l’expert assigné à ce projet peut enregistrer l’avancement.',
      );
    }
    const pct = Math.max(0, Math.min(100, Math.round(Number(avancement))));
    if (!Number.isFinite(pct)) {
      throw new BadRequestException('Pourcentage invalide.');
    }
    const desc =
      String(note ?? '').trim() ||
      'Mise à jour de l’avancement par l’expert (sans photo).';

    await this.suiviProjectService.create({
      projectId: new Types.ObjectId(projectId),
      date_suivi: new Date(),
      description_progression: desc,
      pourcentage_avancement: pct,
      cout_actuel: 0,
      workerId: new Types.ObjectId(expertId),
    });

    const fresh = await this.projectModel.findById(projectId).lean().exec();
    return fresh as Project;
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

    const createdApplication =
      project.applications[project.applications.length - 1];

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
    actorUserId: string,
  ) {
    if (!this.isValidObjectId(applicationId)) {
      throw new BadRequestException('ID de candidature invalide.');
    }

    const uid = String(actorUserId || '').trim();
    if (!uid || !this.isValidObjectId(uid)) {
      throw new ForbiddenException(
        'Identifiant expert manquant (en-tête x-user-id).',
      );
    }

    const actor: any = await this.userModel.findById(uid).lean().exec();
    if (!actor) {
      throw new ForbiddenException('Utilisateur introuvable.');
    }
    if (String(actor.role || '').toLowerCase() !== 'expert') {
      throw new ForbiddenException(
        'Seuls les experts peuvent traiter les candidatures.',
      );
    }

    const applicationObjectId = new Types.ObjectId(applicationId);
    const project: any = await this.projectModel
      .findOne({ 'applications._id': applicationObjectId })
      .exec();

    if (!project) {
      throw new NotFoundException('Candidature introuvable.');
    }

    const assignedExpert = project.expertId?.toString?.();
    if (!assignedExpert) {
      throw new ForbiddenException(
        'Aucun expert n’est assigné à ce projet : impossible de traiter la candidature pour l’instant.',
      );
    }
    if (assignedExpert !== uid) {
      throw new ForbiddenException(
        'Seul l’expert assigné à ce projet peut accepter ou refuser les artisans.',
      );
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
