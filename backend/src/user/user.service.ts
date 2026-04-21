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
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
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

/** Évite TypeError si la date en base n’est pas typée `Date` (chaîne / nombre / legacy). */
function getVerificationExpiryMs(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

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
   * Inscription : envoi vers l’e-mail du formulaire (Gmail SMTP / Nodemailer si configuré).
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
        if (payload.role === 'expert' && payload.cv_document_path) {
          this.unlinkExpertCvFile(String(payload.cv_document_path));
        }
        if (payload.role === 'livreur' && payload.cin_permis_document_path) {
          this.unlinkLivreurCinFile(String(payload.cin_permis_document_path));
        }
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
          'Inscription indisponible en production : configurez MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS et MAIL_FROM dans backend/.env.',
        );
      }
      if (!etherealDev) {
        throw new BadRequestException(
          'Pour envoyer la confirmation : MAIL_HOST, MAIL_USER, MAIL_PASS, MAIL_FROM dans backend/.env, ou USE_ETHEREAL_IN_DEV=true pour un test sans vraie boîte.',
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
      if (payload.role === 'expert' && payload.cv_document_path) {
        this.unlinkExpertCvFile(String(payload.cv_document_path));
      }
      if (payload.role === 'livreur' && payload.cin_permis_document_path) {
        this.unlinkLivreurCinFile(String(payload.cin_permis_document_path));
      }
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
      if (payload.role === 'expert' && payload.cv_document_path) {
        this.unlinkExpertCvFile(String(payload.cv_document_path));
      }
      if (payload.role === 'livreur' && payload.cin_permis_document_path) {
        this.unlinkLivreurCinFile(String(payload.cin_permis_document_path));
      }
      const raw = err instanceof Error ? err.message : '';
      const hint = raw ? hintForSmtpFailure(raw) : '';
      throw new BadRequestException(
        hint
          ? `Envoi impossible : ${hint}`
          : "L'envoi de l'e-mail de vérification a échoué. Vérifiez MAIL_* (Gmail : mot de passe d'application).",
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

    const expMs = getVerificationExpiryMs(user.emailVerificationExpires);
    if (expMs == null || expMs < Date.now()) {
      throw new BadRequestException('Lien invalide ou expiré.');
    }

    try {
      const r = await this.userModel.updateOne(
        { _id: user._id, emailVerificationToken: token },
        {
          $set: { isEmailVerified: true },
          $unset: { emailVerificationToken: '', emailVerificationExpires: '' },
        },
      );
      if (r.matchedCount === 0) {
        throw new BadRequestException('Lien invalide ou expiré.');
      }
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (e instanceof BadRequestException) throw e;
      this.logger.error(
        `verifyEmailByToken update failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      if (err?.code === 11000) {
        throw new BadRequestException(
          'Configuration base de données : exécutez dans /backend : node scripts/fix-email-verification-token-index.js puis réessayez.',
        );
      }
      throw e;
    }

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

  /** Supprime un fichier CV expert uploadé (chemin public `/uploads/expert-cv/...`). */
  unlinkExpertCvFile(publicPath: string | undefined): void {
    if (!publicPath || typeof publicPath !== 'string') return;
    const rel = publicPath.replace(/^\/+/, '');
    if (!rel.startsWith('uploads/expert-cv/')) return;
    const abs = join(process.cwd(), 'public', rel);
    const root = join(process.cwd(), 'public', 'uploads', 'expert-cv');
    try {
      if (!abs.startsWith(root)) return;
      if (existsSync(abs)) unlinkSync(abs);
    } catch {
      /* ignore */
    }
  }

  unlinkLivreurCinFile(publicPath: string | undefined): void {
    if (!publicPath || typeof publicPath !== 'string') return;
    const rel = publicPath.replace(/^\/+/, '');
    if (!rel.startsWith('uploads/livreur-cin/')) return;
    const abs = join(process.cwd(), 'public', rel);
    const root = join(process.cwd(), 'public', 'uploads', 'livreur-cin');
    try {
      if (!abs.startsWith(root)) return;
      if (existsSync(abs)) unlinkSync(abs);
    } catch {
      /* ignore */
    }
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
    } else if (dto.role === 'expert') {
      const cvPath =
        typeof dto.cv_document_path === 'string'
          ? dto.cv_document_path.trim()
          : '';
      if (
        !cvPath ||
        !cvPath.startsWith('/uploads/expert-cv/') ||
        cvPath.includes('..')
      ) {
        throw new BadRequestException(
          'Inscription expert : utilisez POST /api/users/expert (multipart) avec un CV PDF ou DOCX (max 5 Mo).',
        );
      }
      const domaine =
        typeof dto.domaine_expertise === 'string'
          ? dto.domaine_expertise.trim()
          : '';
      if (domaine.length < 2) {
        throw new BadRequestException('Domaine d’expertise requis.');
      }
      dto.domaine_expertise = domaine;

      if (dto.experience_annees !== undefined) {
        const n = Number(dto.experience_annees);
        if (!Number.isFinite(n) || n < 0 || n > 50) {
          throw new BadRequestException(
            'Années d’expérience : entier entre 0 et 50.',
          );
        }
        dto.experience_annees = Math.floor(n);
      } else {
        throw new BadRequestException('Années d’expérience requises.');
      }

      const allowedNiveaux = [
        'bac_plus_3',
        'bac_plus_5',
        'doctorat',
        'autre',
      ] as const;
      const nv = String(dto.niveau_etudes || '').trim();
      if (!allowedNiveaux.includes(nv as (typeof allowedNiveaux)[number])) {
        throw new BadRequestException('Niveau d’études invalide.');
      }
      dto.niveau_etudes = nv;
      dto.cv_document_path = cvPath;

      if (dto.linkedin_url !== undefined && dto.linkedin_url !== null) {
        const li = String(dto.linkedin_url).trim();
        if (li === '') {
          delete dto.linkedin_url;
        } else {
          let u: URL;
          try {
            u = new URL(li);
          } catch {
            throw new BadRequestException('URL LinkedIn invalide.');
          }
          if (!/^https?:$/i.test(u.protocol)) {
            throw new BadRequestException('URL LinkedIn invalide.');
          }
          const hn = u.hostname.toLowerCase();
          if (hn !== 'linkedin.com' && !hn.endsWith('.linkedin.com')) {
            throw new BadRequestException(
              'LinkedIn : utilisez une URL du domaine linkedin.com.',
            );
          }
          dto.linkedin_url = li;
        }
      }
    } else if (dto.role === 'livreur') {
      const cinPath =
        typeof dto.cin_permis_document_path === 'string'
          ? dto.cin_permis_document_path.trim()
          : '';
      if (
        !cinPath ||
        !cinPath.startsWith('/uploads/livreur-cin/') ||
        cinPath.includes('..')
      ) {
        throw new BadRequestException(
          'Inscription livreur : utilisez POST /api/users/livreur (multipart) avec CIN / permis (JPG, PNG ou PDF, max 3 Mo).',
        );
      }
      dto.cin_permis_document_path = cinPath;

      const transports = ['velo', 'moto', 'voiture', 'camionnette'] as const;
      const mt = String(dto.livreur_transport || '').trim();
      if (!transports.includes(mt as (typeof transports)[number])) {
        throw new BadRequestException('Moyen de transport invalide.');
      }
      dto.livreur_transport = mt;

      const zRaw = this.normalizeWorkZones(dto.zones_livraison);
      const livreurScopes: WorkZoneScope[] = ['tn_all', 'tn_city', 'tn_region'];
      dto.zones_livraison = zRaw.filter((z) => livreurScopes.includes(z.scope));
      if (!dto.zones_livraison.length) {
        throw new BadRequestException('Zones de livraison requises.');
      }

      const okDisp = ['temps_plein', 'temps_partiel', 'weekend'] as const;
      const dispArr = Array.isArray(dto.livreur_disponibilite)
        ? dto.livreur_disponibilite
        : [];
      const disp = [...new Set(dispArr.map((x) => String(x).trim()))].filter(
        (d) => okDisp.includes(d as (typeof okDisp)[number]),
      );
      if (!disp.length) {
        throw new BadRequestException('Disponibilité requise.');
      }
      dto.livreur_disponibilite = disp;
    } else {
      if (dto.zones_travail !== undefined) {
        dto.zones_travail = this.normalizeWorkZones(dto.zones_travail);
      }
    }

    if (dto.role !== 'artisan') {
      delete dto.specialite;
      delete dto.zones_travail;
    }
    if (dto.role !== 'expert') {
      delete dto.domaine_expertise;
      delete dto.niveau_etudes;
      delete dto.cv_document_path;
      delete dto.linkedin_url;
    }
    if (dto.role !== 'livreur') {
      delete dto.livreur_transport;
      delete dto.zones_livraison;
      delete dto.cin_permis_document_path;
      delete dto.livreur_disponibilite;
    }
    if (dto.role !== 'artisan' && dto.role !== 'expert') {
      delete dto.experience_annees;
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
      'tn_region',
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

      if (
        (scope === 'tn_city' ||
          scope === 'country' ||
          scope === 'tn_region') &&
        !value
      )
        continue;

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
