import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

type SafeUser = Omit<User, 'mot_de_passe'>;

/** Rôles affichés dans « Travailleurs » / matching terrain */
export const FIELD_WORKER_ROLES = [
  'artisan',
  'ouvrier',
  'electricien',
  'expert',
  'architecte',
] as const;

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: Partial<User>): Promise<User> {
<<<<<<< Updated upstream
    const createdUser = new this.userModel(createUserDto);
=======
    const dto: any = { ...(createUserDto as any) };

    if (typeof dto.nom === 'string') dto.nom = dto.nom.trim();
    if (typeof dto.email === 'string') dto.email = dto.email.trim().toLowerCase();
    if (typeof dto.telephone === 'string') dto.telephone = dto.telephone.trim();

    if (dto.telephone === '') delete dto.telephone;

    const artisanLike = ['artisan', 'electricien', 'ouvrier', 'architecte'];
    if (artisanLike.includes(dto.role)) {
      if (typeof dto.specialite === 'string') dto.specialite = dto.specialite.trim();
      if (!dto.specialite) {
        throw new Error('Spécialité requise pour ce profil terrain');
      }

      if (dto.experience_annees !== undefined) {
        const n = Number(dto.experience_annees);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error("Expérience invalide (années)");
        }
        dto.experience_annees = Math.floor(n);
      } else {
        throw new Error("Expérience requise pour ce profil terrain");
      }

      dto.zones_travail = this.normalizeWorkZones(dto.zones_travail);
      if (!dto.zones_travail || dto.zones_travail.length === 0) {
        throw new Error('Zones de travail requises pour ce profil terrain');
      }
    } else {
      // Normalisation optionnelle si fourni
      if (dto.zones_travail !== undefined) {
        dto.zones_travail = this.normalizeWorkZones(dto.zones_travail);
      }
    }

    const createdUser = new this.userModel(dto);
>>>>>>> Stashed changes
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

  /** Liste profils terrain (même format que l’ancien Express /api/workers) */
  async findFieldWorkers(): Promise<Record<string, unknown>[]> {
    const list = await this.userModel
      .find({ role: { $in: [...FIELD_WORKER_ROLES] } })
      .sort({ nom: 1 })
      .select(
        'nom email role specialite experience_annees rating isAvailable location.city location.gouvernorat',
      )
      .lean()
      .exec();
    return list.map((u: any) => ({
      ...u,
      name: u.nom,
      workerType: u.role,
      experienceYears: u.experience_annees ?? 0,
    }));
  }

  async findFieldWorkerById(id: string): Promise<Record<string, unknown> | null> {
    const w = await this.userModel.findById(id).lean().exec();
    if (!w) return null;
    const u = w as any;
    return {
      ...u,
      name: u.nom,
      workerType: u.role,
      experienceYears: u.experience_annees ?? 0,
    };
  }

  async patchFieldWorker(
    id: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const allowed = ['isAvailable', 'nom', 'telephone', 'bio', 'skills', 'dailyRate'];
    const patch: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in body) patch[k] = body[k];
    }
    const w = await this.userModel
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean()
      .exec();
    if (!w) return null;
    const u = w as any;
    return {
      ...u,
      name: u.nom,
      workerType: u.role,
      experienceYears: u.experience_annees ?? 0,
    };
  }
}
