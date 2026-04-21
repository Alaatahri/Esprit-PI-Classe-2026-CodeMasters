import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ProjectService } from '../project/project.service';
import { ProposalsService } from '../proposals/proposals.service';
import { MatchingService } from './matching.service';

function idString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && '_id' in v) {
    const i = (v as { _id: unknown })._id;
    return i != null ? String(i) : '';
  }
  return String(v);
}

@Controller('matching/expert')
export class MatchingExpertCatalogController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly matchingService: MatchingService,
    private readonly proposalsService: ProposalsService,
  ) {}

  @Get('catalog')
  async catalog() {
    const projects = await this.projectService.findAll(500);
    const out = [];
    for (const proj of projects as unknown as Record<string, unknown>[]) {
      const pid = idString(proj._id);
      const matching = await this.matchingService.statsForProject(pid);
      out.push({
        project: {
          _id: pid,
          titre: proj.titre,
          description: proj.description,
          ville: proj.ville,
          statut: proj.statut,
          requestStatus: proj.requestStatus,
          createdAt: proj.createdAt,
          expertId: proj.expertId,
          clientId: proj.clientId,
        },
        matching,
      });
    }
    return out;
  }

  @Get('catalog/:projectId')
  async catalogByProject(@Param('projectId') projectId: string) {
    const proj = await this.projectService.findOne(projectId);
    if (!proj) {
      throw new NotFoundException('Projet introuvable.');
    }
    const p = proj as unknown as Record<string, unknown>;
    const proposals = await this.proposalsService.findByProject(projectId);
    return {
      project: { ...p, _id: idString(p._id) },
      matchingRequests: [],
      proposals,
    };
  }
}
