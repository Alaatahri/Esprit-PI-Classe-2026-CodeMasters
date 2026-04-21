import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['draft', 'sent', 'countered', 'accepted', 'declined'],
    default: 'sent',
  })
  status: string;

  @Prop({ required: true })
  proposedPrice: number;

  @Prop({ required: true })
  estimatedDurationDays: number;

  @Prop()
  technicalNotes?: string;

  @Prop()
  materialSuggestions?: string;

  @Prop()
  clientCounterPrice?: number;

  @Prop()
  clientCounterDurationDays?: number;

  @Prop()
  clientCounterMessage?: string;

  @Prop({ type: Object })
  lastClientCounterSnapshot?: Record<string, unknown>;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);
