import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProjectService } from '../project/project.service';
import { MatchingService } from './matching.service';

/**
 * Matching automatique:
 * - Si un projet est "En attente" sans expert
 * - Et qu'il n'y a aucune invitation pending active (non expirée)
 * Alors on lance un auto-match et on invite 1 expert (top1).
 *
 * Les invitations expirent au bout de 24h par défaut (expiresInDays=1).
 */
@Injectable()
export class MatchingScheduler {
  constructor(
    private readonly projectService: ProjectService,
    private readonly matchingService: MatchingService,
  ) {}

  @Cron('*/5 * * * *') // toutes les 5 minutes
  async tick() {
    const aiUrl = (process.env.MATCHING_AI_URL || '').trim();
    if (!aiUrl) {
      // Pas de matching auto possible sans URL AI configurée
      return;
    }

    const projects = await this.projectService.findPendingWithoutExpert(120);
    for (const p of projects) {
      try {
        await this.matchingService.adminAutoMatch(p._id, {
          limit: 25,
          expiresInDays: 1,
        });
      } catch {
        // silent: on ne bloque pas la boucle
      }
    }
  }
}

