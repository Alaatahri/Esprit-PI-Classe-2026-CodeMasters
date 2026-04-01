import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AppNotificationDocument = AppNotification & Document;

/**
 * Notifications in-app (backoffice / futures intégrations).
 * Collection Mongo : `notifications`.
 */
@Schema({ timestamps: true, collection: 'notifications' })
export class AppNotification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId: Types.ObjectId;

  @Prop()
  recipientRole?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  /** progress_update | no_progress | delay_alert */
  @Prop({ required: true })
  type: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, unknown>;
}

export const AppNotificationSchema = SchemaFactory.createForClass(AppNotification);
