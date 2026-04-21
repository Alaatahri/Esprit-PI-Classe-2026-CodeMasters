import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Proposal' })
  proposalId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['draft', 'pending_signatures', 'signed', 'cancelled'],
    default: 'pending_signatures',
  })
  status: string;

  @Prop({ default: '' })
  contractText: string;

  @Prop()
  clientSignedAt?: Date;

  @Prop()
  expertSignedAt?: Date;

  @Prop()
  clientSignedPdfUrl?: string;

  @Prop()
  expertSignedPdfUrl?: string;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
