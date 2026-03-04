// backend/src/ai-matching/ai-matching.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Project, ProjectDocument } from '../project/schemas/project.schema';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

export interface ExpertMatch {
  expert_id: string;
  nom: string;
  email: string;
  role: string;
  competences: string[];
  rating_moyen: number;
  nombre_avis: number;
  projets_termines: number;
  score: number;
  pourcentage: number;
  competences_matchees: string[];
  recommandation: string;
}

@Injectable()
export class AiMatchingService {
  private readonly logger = new Logger(AiMatchingService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async matcherExperts(
    projectId: string,
    competencesRequises: string[],
    topN = 3,
  ): Promise<ExpertMatch[]> {
    // 1. Récupère le projet depuis MongoDB
    const projet = (await this.projectModel
      .findById(projectId)
      .lean()
      .exec()) as any;
    if (!projet) throw new Error(`Projet ${projectId} introuvable`);

    // 2. Récupère tous les experts et artisans disponibles
    const experts = (await this.userModel
      .find({ role: { $in: ['expert', 'artisan'] } })
      .lean()
      .exec()) as any[];

    if (!experts.length) {
      this.logger.warn('Aucun expert/artisan trouvé dans la base');
      return [];
    }

    // 3. Enrichit chaque expert avec ses stats calculées depuis les projets
    const expertsEnrichis = await Promise.all(
      experts.map(async (expert) =>
        this.enrichirExpert(expert, competencesRequises),
      ),
    );

    // 4. Appelle le service Python Flask
    return this.appellerServiceIA(
      {
        titre: projet.titre,
        description: projet.description,
        competences_requises: competencesRequises,
        budget_estime: projet.budget_estime,
      },
      expertsEnrichis,
      topN,
    );
  }

  /**
   * Même logique mais pour une liste d'IDs d'experts spécifiques.
   */
  async matcherExpertsParIds(
    projectId: string,
    expertIds: string[],
    competencesRequises: string[],
    topN = 3,
  ): Promise<ExpertMatch[]> {
    const projet = (await this.projectModel
      .findById(projectId)
      .lean()
      .exec()) as any;
    if (!projet) throw new Error(`Projet ${projectId} introuvable`);

    const experts = (await this.userModel
      .find({ _id: { $in: expertIds } })
      .lean()
      .exec()) as any[];

    const expertsEnrichis = await Promise.all(
      experts.map(async (e) => this.enrichirExpert(e, competencesRequises)),
    );

    return this.appellerServiceIA(
      {
        titre: projet.titre,
        description: projet.description,
        competences_requises: competencesRequises,
        budget_estime: projet.budget_estime,
      },
      expertsEnrichis,
      topN,
    );
  }

  // ---------------------------------------------------------------------------
  // Méthodes privées
  // ---------------------------------------------------------------------------

  /**
   * Calcule le rating moyen et le nombre de projets terminés d'un expert
   * en agrégeant les données depuis la collection Project.
   */
  private async enrichirExpert(
    expert: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _competencesRequises: string[],
  ): Promise<any> {
    // Projets terminés où cet expert est assigné
    const projetsTermines = (await this.projectModel
      .find({ expertId: expert._id, statut: 'Terminé' })
      .lean()
      .exec()) as any[];

    // Calcul du rating moyen (depuis clientRating sur les projets terminés)
    const ratings = projetsTermines
      .map((p) => p.clientRating)
      .filter((r) => typeof r === 'number' && r > 0);

    const rating_moyen =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10,
          ) / 10
        : 0;

    // Compétences : extraites du champ 'nom' ou d'un futur champ 'competences'
    // Pour l'instant on infère les compétences depuis les projets ou le nom
    // Tu pourras ajouter un champ 'competences: []' au schéma User plus tard
    const competences = this.inferCompetencesDepuisExpert(
      expert,
      projetsTermines,
    );

    return {
      id: expert._id.toString(),
      nom: expert.nom,
      email: expert.email,
      role: expert.role,
      competences,
      rating_moyen,
      nombre_avis: ratings.length,
      projets_termines: projetsTermines.length,
    };
  }

  /**
   * Inférence temporaire des compétences.
   * → Remplace par expert.competences[] quand tu ajoutes ce champ au schéma User.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private inferCompetencesDepuisExpert(expert: any, _projets: any[]): string[] {
    // Si l'expert a déjà un champ competences (futur), on l'utilise
    if (Array.isArray(expert.competences) && expert.competences.length) {
      return expert.competences;
    }
    // Sinon on retourne un tableau vide (l'algo TF-IDF utilisera le nom/description)
    return [];
  }

  /**
   * Appel HTTP vers le microservice Python Flask.
   * Fallback gracieux si le service est indisponible.
   */
  private async appellerServiceIA(
    projet: any,
    experts: any[],
    topN: number,
  ): Promise<ExpertMatch[]> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/match-experts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projet, experts, top_n: topN }),
        signal: AbortSignal.timeout(10_000), // timeout 10s
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Service IA erreur ${response.status}: ${err}`);
      }

      const data: any = await response.json();
      this.logger.log(
        `Matching OK: ${data.experts_matches?.length} résultats pour "${projet.titre}"`,
      );
      return data.experts_matches ?? [];
    } catch (error) {
      this.logger.error(`Service IA indisponible: ${error.message}`);
      // Fallback : retourne les experts triés par projets terminés
      return experts
        .sort((a, b) => b.projets_termines - a.projets_termines)
        .slice(0, topN)
        .map((e) => ({
          expert_id: e.id,
          nom: e.nom,
          email: e.email,
          role: e.role,
          competences: e.competences,
          rating_moyen: e.rating_moyen,
          nombre_avis: e.nombre_avis,
          projets_termines: e.projets_termines,
          score: null,
          pourcentage: null,
          competences_matchees: [],
          recommandation: 'Service IA indisponible – tri par expérience',
        }));
    }
  }
}
