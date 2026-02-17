import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProduitDocument = Produit & Document;

@Schema({ timestamps: true })
export class Produit {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  prix: number;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop()
  image_url?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendeurId: Types.ObjectId;
}

export const ProduitSchema = SchemaFactory.createForClass(Produit);
