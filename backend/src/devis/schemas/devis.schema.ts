import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DevisArticle = {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
};

export type DevisDocument = Devis & Document;

@Schema({ timestamps: true })
export class Devis {
  @Prop({ unique: true })
  numero_devis: string;

  @Prop({ required: true })
  titre: string;

  @Prop()
  description: string;

  @Prop({ type: Array, default: [] })
  articles: DevisArticle[];

  @Prop({ required: true, default: 0 })
  montant_total: number;

  @Prop({
    required: true,
    enum: ['brouillon', 'envoyé', 'accepté', 'refusé', 'expiré'],
    default: 'brouillon',
  })
  statut: string;

  @Prop({ required: true, default: 30 })
  delai_validite: number;

  @Prop({ required: true, default: Date.now })
  date_creation: Date;

  @Prop({ type: Date })
  date_envoi: Date;

  @Prop({ type: Date })
  date_acceptation: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  artisanId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId: Types.ObjectId;

  @Prop()
  temp_client_nom: string;

  @Prop()
  temp_client_email: string;
}

export const DevisSchema = SchemaFactory.createForClass(Devis);
