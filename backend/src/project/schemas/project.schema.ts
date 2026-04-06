import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  titre: string;

  /** Catégorie du projet (rénovation, plomberie, etc.) */
  @Prop()
  categorie?: string;

  @Prop({ required: true })
  description: string;

  /** Localisation */
  @Prop()
  ville?: string;

  @Prop()
  adresse?: string;

  @Prop({
    type: { lat: { type: Number }, lng: { type: Number } },
    _id: false,
  })
  gps?: { lat?: number; lng?: number };

  @Prop({ required: true })
  date_debut: Date;

  @Prop({ required: true })
  date_fin_prevue: Date;

  @Prop({ required: true })
  budget_estime: number;

  /** Budget range optionnel (nouveau formulaire) */
  @Prop()
  budget_min?: number;

  @Prop()
  budget_max?: number;

  /** Détails projet */
  @Prop()
  surface_m2?: number;

  @Prop()
  type_batiment?: string;

  /** Urgence: urgent | normal | flexible */
  @Prop({ enum: ['urgent', 'normal', 'flexible'], default: 'normal' })
  urgence?: 'urgent' | 'normal' | 'flexible';

  /** Exigences techniques / matériaux */
  @Prop()
  preferences_materiaux?: string;

  @Prop()
  exigences_techniques?: string;

  /** URLs fichiers (plans / docs) */
  @Prop({ type: [String], default: [] })
  pieces_jointes?: string[];

  /** URLs photos du site (état actuel) */
  @Prop({ type: [String], default: [] })
  photos_site?: string[];

  /**
   * Workflow "demande projet" (plus précis que `statut` historique).
   * - submitted: demande envoyée
   * - expert_review: en cours d’évaluation
   * - proposal_sent: proposition envoyée
   * - negotiation: négociation
   * - accepted/rejected: décision client
   * - contract_pending_signatures: contrat généré, signatures en attente
   * - active/completed/cancelled/disputed: exécution
   */
  @Prop({
    type: String,
    enum: [
      'draft',
      'submitted',
      'expert_review',
      'proposal_sent',
      'negotiation',
      'accepted',
      'rejected',
      'contract_pending_signatures',
      'active',
      'completed',
      'cancelled',
      'disputed',
    ],
    default: 'submitted',
  })
  requestStatus?: string;

  @Prop({
    required: true,
    enum: ['En attente', 'En cours', 'Terminé'],
    default: 'En attente',
  })
  statut: string;

  @Prop({
    required: true,
    default: 0,
    min: 0,
    max: 100,
  })
  avancement_global: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  expertId?: Types.ObjectId;

  @Prop({
    type: [
      {
        artisanId: { type: Types.ObjectId, ref: 'User', required: true },
        statut: {
          type: String,
          enum: ['en_attente', 'acceptee', 'refusee'],
          default: 'en_attente',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  applications?: Array<{
    _id?: Types.ObjectId;
    artisanId: Types.ObjectId;
    statut: 'en_attente' | 'acceptee' | 'refusee';
    createdAt: Date;
  }>;

  @Prop({ min: 1, max: 5 })
  clientRating?: number;

  @Prop()
  clientComment?: string;

  @Prop({ min: 1, max: 5 })
  expertRating?: number;

  @Prop({ min: 1, max: 5 })
  artisanRating?: number;

  /** URLs photos « avant travaux » (vitrine / galerie publique) */
  @Prop({ type: [String], default: [] })
  photosAvant?: string[];

  /** URLs photos « après travaux » */
  @Prop({ type: [String], default: [] })
  photosApres?: string[];

  /** Commentaire libre de l’expert (vitrine / fiche publique) */
  @Prop()
  expertComment?: string;

  /** Commentaire libre de l’équipe artisan */
  @Prop()
  artisanComment?: string;

  /** Avis additionnels pour la vitrine (invités, voisins, second passage…) */
  @Prop({
    type: [
      {
        text: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5 },
        author: { type: String, required: true },
        role: {
          type: String,
          enum: ['client', 'expert', 'artisan', 'visiteur'],
          default: 'visiteur',
        },
      },
    ],
    default: [],
  })
  showcaseReviews?: Array<{
    text: string;
    rating?: number;
    author: string;
    role: 'client' | 'expert' | 'artisan' | 'visiteur';
  }>;

  /** Note / retour expert sur le dossier (interne ou partagé selon usage) */
  @Prop()
  expertFeedback?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
