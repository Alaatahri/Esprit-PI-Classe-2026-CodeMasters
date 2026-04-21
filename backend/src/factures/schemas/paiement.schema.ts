import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaiementDocument = Paiement & Document;

@Schema({ timestamps: true })
export class Paiement {
  @Prop({ type: Types.ObjectId, ref: 'Facture', required: true })
  factureId: Types.ObjectId;

  @Prop({ required: true })
  montant: number;

  @Prop({ required: true, default: 'carte' })
  methode_paiement: string;

  @Prop({ type: Object })
  details: any;

  @Prop({ required: true, default: Date.now })
  date_paiement: Date;
}

export const PaiementSchema = SchemaFactory.createForClass(Paiement);
