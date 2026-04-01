import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SuiviDocument = Suivi & Document;

/**
 * Même collection MongoDB que `SuiviProject` (`suiviprojects`), avec champs étendus
 * pour le suivi photo + analyse IA. Aucun champ existant n'est supprimé/renommé.
 */
@Schema({ timestamps: true, collection: 'suiviprojects' })
export class Suivi {
  // Champs existants (compat)
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop()
  date_suivi?: Date;

  @Prop()
  description_progression?: string;

  @Prop({ min: 0, max: 100 })
  pourcentage_avancement?: number;

  @Prop()
  cout_actuel?: number;

  @Prop()
  photo_url?: string;

  // Nouveaux champs (STEP 1)
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

export const SuiviSchema = SchemaFactory.createForClass(Suivi);
