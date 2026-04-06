import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  proposedPrice: number;

  @Prop({ required: true, min: 1 })
  estimatedDurationDays: number;

  @Prop({ required: true, maxlength: 50000 })
  technicalNotes: string;

  @Prop({ maxlength: 12000 })
  materialSuggestions?: string;

  @Prop({
    type: String,
    enum: ['sent', 'accepted', 'rejected', 'countered'],
    default: 'sent',
  })
  status: 'sent' | 'accepted' | 'rejected' | 'countered';

  /** Contre-proposition client (négociation) */
  @Prop()
  clientCounterPrice?: number;

  @Prop()
  clientCounterDurationDays?: number;

  @Prop({ maxlength: 12000 })
  clientCounterMessage?: string;

  @Prop()
  counteredAt?: Date;

  /** Conservé après révision expert : dernière contre-proposition client (audit / vue expert). */
  @Prop({
    type: {
      proposedPrice: Number,
      estimatedDurationDays: Number,
      message: String,
      counteredAt: Date,
    },
    required: false,
  })
  lastClientCounterSnapshot?: {
    proposedPrice: number;
    estimatedDurationDays: number;
    message: string;
    counteredAt?: Date;
  };
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);
ProposalSchema.index({ projectId: 1, createdAt: -1 });
ProposalSchema.index({ expertId: 1, createdAt: -1 });
