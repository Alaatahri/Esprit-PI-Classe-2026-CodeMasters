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
    max: 100
  })
  pourcentage_avancement: number;

  @Prop({ required: true })
  cout_actuel: number;

  @Prop()
  photo_url?: string;
}

export const SuiviProjectSchema = SchemaFactory.createForClass(SuiviProject);
