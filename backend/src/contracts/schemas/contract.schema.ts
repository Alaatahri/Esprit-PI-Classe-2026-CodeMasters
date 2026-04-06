import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Proposal', required: true })
  proposalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertId: Types.ObjectId;

  @Prop({ required: true })
  projectTitle: string;

  @Prop({ required: true })
  projectDescription: string;

  @Prop()
  locationText?: string;

  @Prop({ required: true, min: 0 })
  agreedPrice: number;

  @Prop({ required: true, min: 1 })
  estimatedDurationDays: number;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  completionDate: Date;

  @Prop({ type: [String], default: [] })
  responsibilities?: string[];

  @Prop({ type: [String], default: [] })
  penalties?: string[];

  /** Version texte du contrat (pour preview + export futur PDF) */
  @Prop({ required: true })
  contractText: string;

  @Prop({ type: Date })
  clientSignedAt?: Date;

  @Prop({ type: Date })
  expertSignedAt?: Date;

  /** PDF signé par le client (upload) — chemin relatif servi sous /uploads/... */
  @Prop()
  clientSignedPdfUrl?: string;

  /** PDF signé par l’expert (upload) */
  @Prop()
  expertSignedPdfUrl?: string;

  @Prop({
    type: String,
    enum: ['pending_signatures', 'active', 'completed', 'cancelled'],
    default: 'pending_signatures',
  })
  status: 'pending_signatures' | 'active' | 'completed' | 'cancelled';
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
ContractSchema.index({ projectId: 1 }, { unique: true });
