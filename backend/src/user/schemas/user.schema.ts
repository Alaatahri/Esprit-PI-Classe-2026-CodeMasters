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
}

export const UserSchema = SchemaFactory.createForClass(User);
