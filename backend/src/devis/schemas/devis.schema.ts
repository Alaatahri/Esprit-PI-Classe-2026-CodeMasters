import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DevisDocument = Devis & Document;

@Schema({ timestamps: true })
export class Devis {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertId: Types.ObjectId;

  @Prop({ required: true })
  montant_total: number;

  @Prop({ 
    required: true,
    enum: ['En attente', 'Accepté', 'Refusé'],
    default: 'En attente'
  })
  statut: string;

  @Prop({ required: true, default: Date.now })
  date_creation: Date;
}

export const DevisSchema = SchemaFactory.createForClass(Devis);
