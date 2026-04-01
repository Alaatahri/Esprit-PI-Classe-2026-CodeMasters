import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type WorkZoneScope = 'tn_all' | 'tn_city' | 'country' | 'world';
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
    enum: ['client', 'expert', 'artisan', 'manufacturer', 'admin']
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
          enum: ['tn_all', 'tn_city', 'country', 'world'],
          required: true,
        },
        value: { type: String },
      },
    ],
    default: [],
  })
  zones_travail?: WorkZone[];

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
}

export const UserSchema = SchemaFactory.createForClass(User);
