import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

type SafeUser = Omit<User, 'mot_de_passe'>;

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
      .sort({ createdAt: -1 })
      .limit(48)
      .select('-mot_de_passe')
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
}
