import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MatchingRequestDocument = MatchingRequest & Document;

@Schema({ timestamps: true })
export class MatchingRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'refused'],
    default: 'pending',
  })
  status: 'pending' | 'accepted' | 'refused';

  @Prop({ default: 0, min: 0, max: 100 })
  matchScore?: number;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: () => new Date() })
  sentAt: Date;

  @Prop()
  respondedAt?: Date;
}

export const MatchingRequestSchema =
  SchemaFactory.createForClass(MatchingRequest);

MatchingRequestSchema.index({ expertId: 1, projectId: 1 });
