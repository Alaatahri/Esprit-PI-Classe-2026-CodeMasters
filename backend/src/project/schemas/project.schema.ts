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
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
