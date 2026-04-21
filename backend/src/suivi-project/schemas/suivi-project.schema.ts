import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SuiviProjectDocument = SuiviProject & Document;

@Schema({ timestamps: true })
export class SuiviProject {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  date_suivi: Date;

  @Prop({ required: true })
  description_progression: string;

  @Prop({
    required: true,
    min: 0,
    max: 100,
  })
  pourcentage_avancement: number;

  @Prop({ required: true })
  cout_actuel: number;

  @Prop()
  photo_url?: string;

  // Nouveaux champs (ajouts uniquement) — utilisés par le module `suivi`
  @Prop()
  photoUrl?: string;

  @Prop()
  uploadedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  workerId?: Types.ObjectId;

  @Prop({ min: 0, max: 100 })
  progressPercent?: number;

  @Prop({ min: 1 })
  progressIndex?: number;

  @Prop()
  aiAnalysis?: string;
}

export const SuiviProjectSchema = SchemaFactory.createForClass(SuiviProject);
