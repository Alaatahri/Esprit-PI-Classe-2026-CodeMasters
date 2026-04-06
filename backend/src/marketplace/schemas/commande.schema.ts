import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommandeDocument = Commande & Document;

@Schema({ timestamps: true })
export class Commande {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  montant_total: number;

  @Prop({
    required: true,
    enum: ['En attente', 'Payée', 'Livrée'],
    default: 'En attente',
  })
  statut: string;

  @Prop({ required: true, default: Date.now })
  date_commande: Date;
}

export const CommandeSchema = SchemaFactory.createForClass(Commande);
