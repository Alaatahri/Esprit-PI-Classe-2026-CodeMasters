import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

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
    enum: ['client', 'expert', 'artisan', 'manufacturer', 'admin']
  })
  role: string;

  @Prop({ required: true })
  telephone: string;

  /** Champs vitrine / profil public (optionnels — enrichis par le seed). */
  @Prop()
  prenom?: string;

  @Prop()
  specialite?: string;

  @Prop({ type: [String], default: [] })
  competences?: string[];

  @Prop({ min: 0, max: 5 })
  rating?: number;

  @Prop({ min: 0 })
  experience_annees?: number;

  @Prop({
    type: [
      {
        scope: { type: String, required: true },
        value: { type: String, required: false },
      },
    ],
    default: [],
  })
  zones_travail?: Array<{ scope: string; value?: string }>;

  @Prop()
  avatarUrl?: string;

  @Prop()
  bio?: string;

  @Prop({ default: true })
  isAvailable?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
