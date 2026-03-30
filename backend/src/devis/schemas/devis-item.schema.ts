import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DevisItemDocument = DevisItem & Document;

@Schema({ timestamps: true })
export class DevisItem {
  @Prop({ type: Types.ObjectId, ref: 'Devis', required: true })
  devisId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  quantite: number;

  @Prop({ required: true, min: 0 })
  prix_unitaire: number;
}
export const DevisItemSchema = SchemaFactory.createForClass(DevisItem);
