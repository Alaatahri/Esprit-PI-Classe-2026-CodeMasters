import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

<<<<<<< Updated upstream
=======
export type WorkZoneScope = 'tn_all' | 'tn_city' | 'country' | 'world';
export type WorkZone = {
  scope: WorkZoneScope;
  value?: string;
};

/** Rôles connexion + profils terrain (matching sur les mêmes libellés que l’IA) */
export const USER_ROLES = [
  'client',
  'expert',
  'artisan',
  'manufacturer',
  'admin',
  'ouvrier',
  'electricien',
  'architecte',
] as const;

>>>>>>> Stashed changes
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  mot_de_passe: string;

  @Prop({
    required: true,
    enum: USER_ROLES,
  })
  role: string;

<<<<<<< Updated upstream
  @Prop({ required: true })
  telephone: string;
=======
  @Prop()
  telephone?: string;

  @Prop()
  specialite?: string;

  @Prop({ min: 0 })
  experience_annees?: number;

  @Prop({
    type: [
      {
        scope: {
          type: String,
          enum: ['tn_all', 'tn_city', 'country', 'world'],
          required: true,
        },
        value: { type: String },
      },
    ],
    default: [],
  })
  zones_travail?: WorkZone[];

  /** Profil matching (ex-workers) — optionnel pour clients / admins */
  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop({ default: '' })
  bio?: string;

  @Prop({ min: 0, max: 5, default: 0 })
  rating?: number;

  @Prop({ min: 0, default: 0 })
  reviewsCount?: number;

  @Prop({ min: 0, default: 0 })
  activeProjects?: number;

  @Prop({ type: [String], default: [] })
  certifications?: string[];

  @Prop({ min: 0 })
  dailyRate?: number;

  @Prop({
    type: [{ type: String, enum: ['simple', 'moyen', 'complexe'] }],
    default: [],
  })
  projectTypes?: string[];

  @Prop({ default: true })
  isAvailable?: boolean;

  @Prop({
    type: {
      lat: { type: Number },
      lng: { type: Number },
      city: { type: String },
      gouvernorat: { type: String },
    },
  })
  location?: {
    lat?: number;
    lng?: number;
    city?: string;
    gouvernorat?: string;
  };
>>>>>>> Stashed changes
}

export const UserSchema = SchemaFactory.createForClass(User);
