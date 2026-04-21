import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FactureDocument = Facture & Document;

@Schema({ timestamps: true })
export class Facture {
  @Prop({ required: true, unique: true })
  numero_facture: string;

  @Prop({ required: true })
  titre: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  montant_total: number;

  @Prop({ default: 0 })
  montant_paye: number;

  @Prop({ required: true })
  solde_du: number;

  @Prop({
    required: true,
    enum: ['brouillon', 'envoyée', 'payée', 'partiellement_payée', 'en_retard', 'annulée'],
    default: 'brouillon',
  })
  statut: string;

  @Prop({ required: true, default: Date.now })
  date_facture: Date;

  @Prop({ type: Date })
  date_echeance: Date;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  artisanId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Devis' })
  devisId: Types.ObjectId;

  @Prop()
  temp_client_nom: string;

  @Prop()
  temp_client_email: string;
}

export const FactureSchema = SchemaFactory.createForClass(Facture);
