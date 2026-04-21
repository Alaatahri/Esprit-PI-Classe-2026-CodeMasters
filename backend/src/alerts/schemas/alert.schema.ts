import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

@Schema({ timestamps: true, collection: 'alerts' })
export class Alert {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  workerId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  alertDate: Date;

  @Prop({ type: Number, required: true })
  expectedProgress: number;

  @Prop({ type: Number, required: true })
  realProgress: number;

  @Prop({ type: Number, required: true })
  daysRemaining: number;

  @Prop({
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
  })
  status: 'pending' | 'resolved';

  /** Réponse ouvrier : { type, message, estimatedDate?, respondedAt } — stocké en Mixed pour le champ `type`. */
  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  workerResponse?: {
    type: 'solution' | 'estimatedDate';
    message: string;
    estimatedDate?: Date;
    respondedAt: Date;
  };
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
