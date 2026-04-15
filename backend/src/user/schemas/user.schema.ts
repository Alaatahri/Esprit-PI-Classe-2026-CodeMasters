import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type WorkZoneScope =
  | 'tn_all'
  | 'tn_city'
  | 'tn_region'
  | 'country'
  | 'world';
export type WorkZone = {
  scope: WorkZoneScope;
  value?: string;
};

@Schema({ timestamps: true })
export class User {
  @Prop()
  prenom?: string;

  @Prop({ required: true })
  nom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  mot_de_passe: string;

  @Prop({
    required: true,
    enum: ['client', 'expert', 'artisan', 'manufacturer', 'admin', 'livreur'],
  })
  role: string;

  @Prop({ type: [String], default: [] })
  competences?: string[];

  @Prop()
  telephone?: string;

  // Champs spécifiques aux artisans (facultatifs pour les autres rôles)
  @Prop()
  specialite?: string;

  @Prop({ min: 0 })
  experience_annees?: number;

  @Prop({
    type: [
      {
        scope: {
          type: String,
          enum: ['tn_all', 'tn_city', 'tn_region', 'country', 'world'],
          required: true,
        },
        value: { type: String },
      },
    ],
    default: [],
  })
  zones_travail?: WorkZone[];

  /** Livreur — vélo, moto, voiture, camionnette */
  @Prop()
  livreur_transport?: string;

  @Prop({
    type: [
      {
        scope: {
          type: String,
          enum: ['tn_all', 'tn_city', 'tn_region', 'country', 'world'],
          required: true,
        },
        value: { type: String },
      },
    ],
    default: [],
  })
  zones_livraison?: WorkZone[];

  /** Livreur — CIN / permis (JPG, PNG, PDF) */
  @Prop()
  cin_permis_document_path?: string;

  /** Livreur — ex. temps_plein, temps_partiel, weekend */
  @Prop({ type: [String], default: [] })
  livreur_disponibilite?: string[];

  @Prop({ type: Boolean, default: true })
  isAvailable?: boolean;

  @Prop({ type: Number, default: 0 })
  rating?: number;

  @Prop({ type: Number, default: 0 })
  experienceYears?: number;

  /** Photo de profil (URL HTTPS, ex. Unsplash) — affichage vitrine / profil public */
  @Prop()
  avatarUrl?: string;

  /** Présentation courte pour la vitrine */
  @Prop()
  bio?: string;

  /** Expert — domaines couverts (ex. Finance, Droit) */
  @Prop()
  domaine_expertise?: string;

  /** Expert — Bac+3, Bac+5, Doctorat, Autre (clé stockée : bac_plus_3, …) */
  @Prop()
  niveau_etudes?: string;

  /** Expert — chemin relatif servi sous /uploads/... (PDF ou DOCX) */
  @Prop()
  cv_document_path?: string;

  /** Expert — URL profil LinkedIn */
  @Prop()
  linkedin_url?: string;

  /** Anciens comptes : true par défaut (schéma) ; nouvelles inscriptions mises à false jusqu’à vérification. */
  @Prop({ type: Boolean, default: true })
  isEmailVerified?: boolean;

  @Prop({ type: String, default: null, select: false })
  emailVerificationToken?: string | null;

  @Prop({ type: Date, default: null, select: false })
  emailVerificationExpires?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

/** Unicité seulement quand le jeton est une chaîne (plusieurs comptes peuvent avoir le champ absent / null). */
UserSchema.index(
  { emailVerificationToken: 1 },
  {
    unique: true,
    name: 'email_verification_token_unique_string',
    partialFilterExpression: { emailVerificationToken: { $type: 'string' } },
  },
);
