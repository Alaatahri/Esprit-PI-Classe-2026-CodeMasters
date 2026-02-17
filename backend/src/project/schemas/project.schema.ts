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
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
