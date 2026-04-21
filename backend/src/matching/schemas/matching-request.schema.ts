import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MatchingRequestDocument = MatchingRequest & Document;

@Schema({ timestamps: false })
export class MatchingRequest {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'refused'],
    default: 'pending',
  })
  status: 'pending' | 'accepted' | 'refused';

  @Prop({ type: Number })
  matchScore?: number;

  @Prop({ type: [String], default: [] })
  requiredCompetences: string[];

  @Prop({ type: Date, default: Date.now })
  sentAt: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  respondedAt?: Date;
}

export const MatchingRequestSchema =
  SchemaFactory.createForClass(MatchingRequest);

MatchingRequestSchema.index({ projectId: 1, expertId: 1 }, { unique: true });
