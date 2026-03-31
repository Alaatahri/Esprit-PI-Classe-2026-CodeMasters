import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, type WorkZone, type WorkZoneScope } from './schemas/user.schema';

type SafeUser = Omit<User, 'mot_de_passe'>;

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const dto: any = { ...(createUserDto as any) };

    if (typeof dto.prenom === 'string') dto.prenom = dto.prenom.trim();
    if (typeof dto.nom === 'string') dto.nom = dto.nom.trim();
    if (typeof dto.email === 'string') dto.email = dto.email.trim().toLowerCase();
    if (typeof dto.telephone === 'string') dto.telephone = dto.telephone.trim();

    if (dto.telephone === '') delete dto.telephone;
    if (dto.prenom === '') delete dto.prenom;

    if (dto.role === 'artisan') {
      if (typeof dto.specialite === 'string') dto.specialite = dto.specialite.trim();
      if (!dto.specialite) {
        throw new Error('Spécialité requise pour un artisan');
      }

      if (dto.experience_annees !== undefined) {
        const n = Number(dto.experience_annees);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error("Expérience invalide (années)");
        }
        dto.experience_annees = Math.floor(n);
      } else {
        throw new Error("Expérience requise pour un artisan");
      }

      dto.zones_travail = this.normalizeWorkZones(dto.zones_travail);
      if (!dto.zones_travail || dto.zones_travail.length === 0) {
        throw new Error('Zones de travail requises pour un artisan');
      }
    } else {
      // Normalisation optionnelle si fourni
      if (dto.zones_travail !== undefined) {
        dto.zones_travail = this.normalizeWorkZones(dto.zones_travail);
      }
    }

    const createdUser = new this.userModel(dto);
    return createdUser.save();
  }

  private normalizeWorkZones(raw: unknown): WorkZone[] {
    const arr: any[] = Array.isArray(raw) ? raw : raw ? [raw as any] : [];

    const allowedScopes: WorkZoneScope[] = ['tn_all', 'tn_city', 'country', 'world'];
    const out: WorkZone[] = [];

    for (const item of arr) {
      if (!item) continue;

      const scope = item.scope as WorkZoneScope;
      if (!scope || !allowedScopes.includes(scope)) continue;

      const value = typeof item.value === 'string' ? item.value.trim() : undefined;

      // value requis pour tn_city et country
      if ((scope === 'tn_city' || scope === 'country') && !value) continue;

      out.push(value ? { scope, value } : { scope });
    }

    // Déduplication simple
    const seen = new Set<string>();
    const deduped: WorkZone[] = [];
    for (const z of out) {
      const key = `${z.scope}:${z.value ?? ''}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(z);
    }

    return deduped;
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
}
