import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommandeItemDocument = CommandeItem & Document;

@Schema({ timestamps: true })
export class CommandeItem {
  @Prop({ type: Types.ObjectId, ref: 'Commande', required: true })
  commandeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Produit', required: true })
  produitId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantite: number;

  @Prop({ required: true, min: 0 })
  prix: number;
}

export const CommandeItemSchema = SchemaFactory.createForClass(CommandeItem);
