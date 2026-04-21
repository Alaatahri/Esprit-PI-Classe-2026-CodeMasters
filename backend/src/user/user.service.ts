import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ProjectService } from '../project/project.service';

type SafeUser = Omit<User, 'mot_de_passe'>;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly projectService: ProjectService,
  ) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(limit = 100): Promise<User[]> {
    return this.userModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).lean().exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async login(email: string, mot_de_passe: string): Promise<SafeUser | null> {
    try {
      const user = await this.userModel.findOne({ email }).select('+mot_de_passe').lean().exec();
      if (!user) return null;
      if (user.mot_de_passe !== mot_de_passe) return null;
      const { mot_de_passe: _password, ...rest } = user as any;
      return rest as SafeUser;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async remove(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  /**
   * Vitrine : artisans / experts / fabricants — champs publics uniquement (sans mot de passe).
   */
  async findPublicWorkers(): Promise<Record<string, unknown>[]> {
    const users = await this.userModel
      .find({ role: { $in: ['artisan', 'expert', 'manufacturer'] } })
      .select(
        'nom prenom role telephone specialite competences rating experienceYears experience_annees isAvailable zones_travail avatarUrl bio createdAt',
      )
      .sort({ createdAt: -1 })
      .limit(120)
      .lean()
      .exec();

    return users.map((u: any) => ({
      _id: u._id?.toString?.() ?? String(u._id),
      nom: u.nom ?? 'Membre',
      prenom: u.prenom,
      role: u.role,
      telephone: u.telephone,
      specialite: u.specialite,
      competences: u.competences,
      rating: u.rating,
      experienceYears: u.experienceYears ?? u.experience_annees,
      experience_annees: u.experience_annees,
      isAvailable: u.isAvailable ?? true,
      zones_travail: u.zones_travail,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    }));
  }

  /** ISO 8601 ou `undefined` si la valeur n’est pas une date valide (évite 500 sur données legacy). */
  private toIsoSafe(value: unknown): string | undefined {
    if (value == null) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    const d = new Date(value as string | number | Date);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  /**
   * Fiche profil publique pour `/profil/:id` — projets liés + avis extraits des dossiers.
   */
  async getPublicProfile(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Identifiant invalide.');
    }
    // Inclusion uniquement (pas de « -mot_de_passe » mélangé : MongoDB 4.4+ rejette exclusion + inclusion).
    const u: any = await this.userModel
      .findById(userId)
      .select(
        'nom prenom role telephone specialite competences rating experience_annees isAvailable zones_travail avatarUrl bio createdAt',
      )
      .lean()
      .exec();
    if (!u) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }
    const role = String(u.role || '');
    if (role === 'client' || role === 'admin') {
      throw new NotFoundException('Profil non disponible.');
    }
    const idStr = u._id?.toString?.() ?? String(u._id);
    const userPayload = {
      _id: idStr,
      nom: u.nom ?? 'Membre',
      prenom: u.prenom,
      role: u.role,
      telephone: u.telephone,
      specialite: u.specialite,
      competences: u.competences,
      rating: u.rating,
      experienceYears: u.experience_annees,
      experience_annees: u.experience_annees,
      isAvailable: u.isAvailable ?? true,
      zones_travail: u.zones_travail,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    };
    const projectsRaw: any[] =
      role === 'manufacturer'
        ? []
        : await this.projectService.findProjectsForPublicProfile(idStr, role);
    const projects = projectsRaw.map((p) => ({
      _id: String(p._id),
      titre: p.titre,
      description: p.description,
      statut: p.statut,
      avancement_global: p.avancement_global,
      date_debut: this.toIsoSafe(p.date_debut),
      date_fin_prevue: this.toIsoSafe(p.date_fin_prevue),
      clientRating: p.clientRating,
      clientComment: p.clientComment,
      expertRating: p.expertRating,
      artisanRating: p.artisanRating,
    }));
    const completedCount = projects.filter((p) => p.statut === 'Terminé').length;
    const reviews = this.buildPublicProfileReviews(projectsRaw, idStr, role);
    return {
      user: userPayload,
      stats: { projectCount: projects.length, completedCount },
      projects,
      reviews,
    };
  }

  private buildPublicProfileReviews(
    projects: any[],
    userId: string,
    role: string,
  ): Array<{
    projetId: string;
    projetTitre: string;
    note?: number;
    commentaire?: string;
    kind: 'client' | 'artisan' | 'expert';
  }> {
    const reviews: Array<{
      projetId: string;
      projetTitre: string;
      note?: number;
      commentaire?: string;
      kind: 'client' | 'artisan' | 'expert';
    }> = [];
    for (const p of projects) {
      const pid = String(p._id);
      const titre = String(p.titre ?? 'Projet');
      if (
        p.clientRating != null ||
        (p.clientComment && String(p.clientComment).trim().length > 0)
      ) {
        reviews.push({
          projetId: pid,
          projetTitre: titre,
          note:
            typeof p.clientRating === 'number' ? p.clientRating : undefined,
          commentaire: p.clientComment ? String(p.clientComment) : undefined,
          kind: 'client',
        });
      }
      if (role === 'expert') {
        if (
          p.expertRating != null ||
          (p.expertComment && String(p.expertComment).trim().length > 0)
        ) {
          reviews.push({
            projetId: pid,
            projetTitre: titre,
            note:
              typeof p.expertRating === 'number' ? p.expertRating : undefined,
            commentaire: p.expertComment ? String(p.expertComment) : undefined,
            kind: 'expert',
          });
        }
      }
      if (role === 'artisan') {
        const apps = Array.isArray(p.applications) ? p.applications : [];
        const mine = apps.some((a: any) => String(a?.artisanId) === userId);
        if (
          mine &&
          (p.artisanRating != null ||
            (p.artisanComment && String(p.artisanComment).trim().length > 0))
        ) {
          reviews.push({
            projetId: pid,
            projetTitre: titre,
            note:
              typeof p.artisanRating === 'number'
                ? p.artisanRating
                : undefined,
            commentaire: p.artisanComment
              ? String(p.artisanComment)
              : undefined,
            kind: 'artisan',
          });
        }
      }
    }
    return reviews;
  }
}
