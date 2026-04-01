import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  titre: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date_debut: Date;

  @Prop({ required: true })
  date_fin_prevue: Date;

  @Prop({ required: true })
  budget_estime: number;

  @Prop({ 
    required: true,
    enum: ['En attente', 'En cours', 'Terminé'],
    default: 'En attente'
  })
  statut: string;

  @Prop({ 
    required: true,
    default: 0,
    min: 0,
    max: 100
  })
  avancement_global: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  expertId?: Types.ObjectId;

  @Prop({
    type: [
      {
        artisanId: { type: Types.ObjectId, ref: 'User', required: true },
        statut: {
          type: String,
          enum: ['en_attente', 'acceptee', 'refusee'],
          default: 'en_attente',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  applications?: Array<{
    _id?: Types.ObjectId;
    artisanId: Types.ObjectId;
    statut: 'en_attente' | 'acceptee' | 'refusee';
    createdAt: Date;
  }>;

  @Prop({ min: 1, max: 5 })
  clientRating?: number;

  @Prop()
  clientComment?: string;

  @Prop({ min: 1, max: 5 })
  expertRating?: number;

  @Prop({ min: 1, max: 5 })
  artisanRating?: number;

  /** URLs photos « avant travaux » (vitrine / galerie publique) */
  @Prop({ type: [String], default: [] })
  photosAvant?: string[];

  /** URLs photos « après travaux » */
  @Prop({ type: [String], default: [] })
  photosApres?: string[];

  /** Commentaire libre de l’expert (vitrine / fiche publique) */
  @Prop()
  expertComment?: string;

  /** Commentaire libre de l’équipe artisan */
  @Prop()
  artisanComment?: string;

  /** Avis additionnels pour la vitrine (invités, voisins, second passage…) */
  @Prop({
    type: [
      {
        text: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5 },
        author: { type: String, required: true },
        role: {
          type: String,
          enum: ['client', 'expert', 'artisan', 'visiteur'],
          default: 'visiteur',
        },
      },
    ],
    default: [],
  })
  showcaseReviews?: Array<{
    text: string;
    rating?: number;
    author: string;
    role: 'client' | 'expert' | 'artisan' | 'visiteur';
  }>;

  /** Note / retour expert sur le dossier (interne ou partagé selon usage) */
  @Prop()
  expertFeedback?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
