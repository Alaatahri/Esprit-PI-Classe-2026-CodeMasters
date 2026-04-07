import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
  type WorkZone,
  type WorkZoneScope,
} from './schemas/user.schema';
import { ProjectService } from '../project/project.service';
import { MailService } from '../mail/mail.service';
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
} from '../auth/password-reset-token';

type SafeUser = Omit<User, 'mot_de_passe'>;

function hintForSmtpFailure(message: string): string {
  if (/535|BadCredentials|Username and Password not accepted/i.test(message)) {
    return (
      'Gmail a refusé les identifiants SMTP. Créez un « mot de passe d’application » (compte Google → Sécurité → validation en 2 étapes → Mots de passe des applications), collez les 16 caractères dans MAIL_PASS sans espaces, et mettez l’adresse Gmail complète dans MAIL_USER. Le mot de passe habituel du compte ne fonctionne pas pour SMTP.'
    );
  }
  return message;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly projectService: ProjectService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Inscription : envoi vers l’e-mail du formulaire (Resend API ou SMTP si configuré).
   * Sinon : erreur sauf USE_ETHEREAL_IN_DEV=true (faux SMTP) ou ALLOW_REGISTRATION_WITHOUT_SMTP.
   */
  async register(
    createUserDto: Partial<User>,
  ): Promise<{
    message: string;
    emailSent: boolean;
    devBypass?: boolean;
    etherealPreviewUrl?: string;
  }> {
    const payload = await this.prepareUserPayload(createUserDto);
    const smtpOk = this.mailService.isConfigured();
    const isProd = process.env.NODE_ENV === 'production';
    const explicitNoEmailBypass =
      process.env.ALLOW_REGISTRATION_WITHOUT_SMTP?.trim() === 'true';
    const etherealDev =
      process.env.USE_ETHEREAL_IN_DEV?.trim() === 'true';

    if (explicitNoEmailBypass) {
      this.logger.warn(
        'ALLOW_REGISTRATION_WITHOUT_SMTP=true — inscription sans envoi d’e-mail.',
      );
      const doc = new this.userModel({
        ...payload,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });
      try {
        await doc.save();
      } catch (e: unknown) {
        const err = e as { code?: number };
        if (err?.code === 11000) {
          throw new ConflictException('Cette adresse e-mail est déjà utilisée');
        }
        throw e;
      }
      return {
        message:
          'Inscription réussie (sans vérification e-mail — contournement activé côté serveur).',
        emailSent: false,
        devBypass: true,
      };
    }

    if (!smtpOk && !explicitNoEmailBypass) {
      if (isProd) {
        throw new BadRequestException(
          'Inscription indisponible en production : configurez RESEND_API_KEY (recommandé, sans mot de passe Gmail) ou MAIL_HOST + MAIL_USER + MAIL_PASS dans backend/.env.',
        );
      }
      if (!etherealDev) {
        throw new BadRequestException(
          'Pour envoyer la confirmation : RESEND_API_KEY dans backend/.env (recommandé), ou MAIL_* pour Gmail, ou USE_ETHEREAL_IN_DEV=true pour un test sans vraie boîte.',
        );
      }
    }

    const token = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const doc = new this.userModel({
      ...payload,
      isEmailVerified: false,
      emailVerificationToken: token,
      emailVerificationExpires,
    });

    try {
      await doc.save();
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err?.code === 11000) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée');
      }
      throw e;
    }

    const email = String(payload.email);
    const nom = String(payload.nom || '');

    let sendResult: { etherealPreviewUrl?: string; usedEthereal?: boolean };
    try {
      sendResult = await this.mailService.sendVerificationEmail({
        to: email,
        nom,
        token,
      });
    } catch (err) {
      this.logger.error(
        `Échec envoi e-mail de vérification pour ${email}`,
        err,
      );
      await this.userModel.deleteOne({ _id: doc._id });
      const raw = err instanceof Error ? err.message : '';
      const hint = raw ? hintForSmtpFailure(raw) : '';
      throw new BadRequestException(
        hint
          ? `Envoi impossible : ${hint}`
          : "L'envoi de l'e-mail de vérification a échoué. Vérifiez RESEND_API_KEY ou MAIL_* (Gmail : mot de passe d'application).",
      );
    }

    const preview = sendResult.etherealPreviewUrl;
    const msg =
      preview != null
        ? `Inscription réussie (Ethereal — pas de livraison dans une vraie boîte). Ouvrez le lien de prévisualisation pour confirmer, ou configurez MAIL_* pour envoyer à ${email}.`
        : `Inscription réussie. Un e-mail de vérification a été envoyé à ${email} : ouvrez votre boîte (et les indésirables), puis cliquez sur le lien avant de vous connecter.`;

    return {
      message: msg,
      emailSent: true,
      etherealPreviewUrl: preview,
    };
  }

  async verifyEmailByToken(token: string): Promise<{ message: string }> {
    const user = await this.userModel
      .findOne({ emailVerificationToken: token })
      .select('+emailVerificationToken +emailVerificationExpires')
      .exec();

    if (!user) {
      throw new BadRequestException('Lien invalide ou expiré.');
    }

    const exp = user.emailVerificationExpires;
    if (!exp || exp.getTime() < Date.now()) {
      throw new BadRequestException('Lien invalide ou expiré.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return { message: 'Email vérifié avec succès !' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Email manquant');
    }

    const user = await this.userModel.findOne({ email: normalized }).exec();
    if (user) {
      const token = createPasswordResetToken(
        normalized,
        60 * 60 * 1000,
      );
      await this.mailService.sendPasswordResetEmail({
        to: normalized,
        token,
      });
    }

    // Réponse neutre (évite l’énumération d’e-mails)
    return {
      message:
        'Si un compte existe pour cet e-mail, un lien de réinitialisation vient d’être envoyé.',
    };
  }

  async resetPassword(args: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    const token = String(args.token || '').trim();
    const newPassword = String(args.newPassword || '');
    const confirmPassword = String(args.confirmPassword || '');
    if (!token) throw new BadRequestException('Token manquant');
    if (newPassword.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères.');
    }
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas.');
    }

    const verified = verifyPasswordResetToken(token);
    if (!verified) {
      throw new BadRequestException('Lien invalide ou expiré.');
    }

    const user = await this.userModel.findOne({ email: verified.email }).exec();
    if (!user) throw new BadRequestException('Lien invalide ou expiré.');

    await this.userModel.updateOne(
      { _id: (user as any)._id },
      { $set: { mot_de_passe: newPassword } },
    );

    return { message: 'Mot de passe modifié avec succès.' };
  }

  private async prepareUserPayload(
    createUserDto: Partial<User>,
  ): Promise<Record<string, unknown>> {
    const dto: any = { ...(createUserDto as any) };

    if (typeof dto.prenom === 'string') dto.prenom = dto.prenom.trim();
    if (typeof dto.nom === 'string') dto.nom = dto.nom.trim();
    if (typeof dto.email === 'string')
      dto.email = dto.email.trim().toLowerCase();
    if (typeof dto.telephone === 'string') dto.telephone = dto.telephone.trim();

    if (dto.telephone === '') delete dto.telephone;
    if (dto.prenom === '') delete dto.prenom;

    if (dto.role === 'artisan') {
      if (typeof dto.specialite === 'string')
        dto.specialite = dto.specialite.trim();
      if (!dto.specialite) {
        throw new BadRequestException('Spécialité requise pour un artisan');
      }

      if (dto.experience_annees !== undefined) {
        const n = Number(dto.experience_annees);
        if (!Number.isFinite(n) || n < 0) {
          throw new BadRequestException('Expérience invalide (années)');
        }
        dto.experience_annees = Math.floor(n);
      } else {
        throw new BadRequestException('Expérience requise pour un artisan');
      }

      dto.zones_travail = this.normalizeWorkZones(dto.zones_travail);
      if (!dto.zones_travail || dto.zones_travail.length === 0) {
        throw new BadRequestException('Zones de travail requises pour un artisan');
      }
    } else {
      if (dto.zones_travail !== undefined) {
        dto.zones_travail = this.normalizeWorkZones(dto.zones_travail);
      }
    }

    delete dto.isEmailVerified;
    delete dto.emailVerificationToken;
    delete dto.emailVerificationExpires;

    return dto;
  }

  async create(createUserDto: Partial<User>): Promise<User> {
    const payload = await this.prepareUserPayload(createUserDto);
    const createdUser = new this.userModel({
      ...payload,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
    return createdUser.save();
  }

  private normalizeWorkZones(raw: unknown): WorkZone[] {
    const arr: any[] = Array.isArray(raw) ? raw : raw ? [raw as any] : [];

    const allowedScopes: WorkZoneScope[] = [
      'tn_all',
      'tn_city',
      'country',
      'world',
    ];
    const out: WorkZone[] = [];

    for (const item of arr) {
      if (!item) continue;

      const scope = item.scope as WorkZoneScope;
      if (!scope || !allowedScopes.includes(scope)) continue;

      const value =
        typeof item.value === 'string' ? item.value.trim() : undefined;

      if ((scope === 'tn_city' || scope === 'country') && !value) continue;

      out.push(value ? { scope, value } : { scope });
    }

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
    return this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /** Artisans et experts pour la page d'accueil (sans mot de passe ni email). */
  async findPublicWorkers(limit = 48): Promise<Record<string, unknown>[]> {
    const users = await this.userModel
      .find({ role: { $in: ['artisan', 'expert'] } })
      .select('-mot_de_passe -email')
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return users as Record<string, unknown>[];
  }

  /** Profil public + historique projets + avis extraits des projets. */
  async getPublicProfile(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Profil introuvable');
    }
    const user = await this.userModel
      .findById(id)
      .select('-mot_de_passe -email')
      .lean()
      .exec();
    if (
      !user ||
      !['artisan', 'expert'].includes((user as { role?: string }).role || '')
    ) {
      throw new NotFoundException('Profil introuvable');
    }

    const role = (user as { role: string }).role;
    const projects =
      role === 'expert'
        ? await this.projectService.findByExpertId(id)
        : await this.projectService.findAcceptedByArtisan(id);

    type Review = {
      projetId: string;
      projetTitre: string;
      note?: number;
      commentaire?: string;
      kind: 'client' | 'artisan' | 'expert';
    };
    const reviews: Review[] = [];

    for (const p of projects) {
      const pid = String((p as { _id?: Types.ObjectId })._id ?? '');
      const titre = p.titre;
      if (p.clientComment && String(p.clientComment).trim()) {
        reviews.push({
          projetId: pid,
          projetTitre: titre,
          note: p.clientRating,
          commentaire: p.clientComment,
          kind: 'client',
        });
      }
      if (role === 'artisan' && typeof p.artisanRating === 'number') {
        reviews.push({
          projetId: pid,
          projetTitre: titre,
          note: p.artisanRating,
          kind: 'artisan',
        });
      }
      if (role === 'expert' && typeof p.expertRating === 'number') {
        reviews.push({
          projetId: pid,
          projetTitre: titre,
          note: p.expertRating,
          kind: 'expert',
        });
      }
    }

    const completedCount = projects.filter(
      (p) => p.statut === 'Terminé',
    ).length;

    return {
      user,
      stats: {
        projectCount: projects.length,
        completedCount,
      },
      projects: projects.map((p) => ({
        _id: (p as { _id?: Types.ObjectId })._id,
        titre: p.titre,
        description: p.description,
        statut: p.statut,
        avancement_global: p.avancement_global,
        date_debut: p.date_debut,
        date_fin_prevue: p.date_fin_prevue,
        clientRating: p.clientRating,
        clientComment: p.clientComment,
        expertRating: p.expertRating,
        artisanRating: p.artisanRating,
      })),
      reviews,
    };
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).lean().exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async login(email: string, mot_de_passe: string): Promise<SafeUser | null> {
    try {
      const user = await this.userModel
        .findOne({ email })
        .select('+mot_de_passe')
        .lean()
        .exec();
      if (!user) return null;
      if (user.mot_de_passe !== mot_de_passe) return null;
      if (user.isEmailVerified === false) {
        throw new UnauthorizedException(
          'Veuillez vérifier votre email avant de vous connecter.',
        );
      }
      const rest = { ...(user as Record<string, unknown>) };
      delete (rest as { mot_de_passe?: string }).mot_de_passe;
      delete (rest as { emailVerificationToken?: unknown })
        .emailVerificationToken;
      delete (rest as { emailVerificationExpires?: unknown })
        .emailVerificationExpires;
      return rest as SafeUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error('Login error:', error);
      return null;
    }
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    const dto: any = { ...updateUserDto };
    delete dto.emailVerificationToken;
    delete dto.emailVerificationExpires;
    return this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
