import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EstimateMatchingDto } from './dto/estimate-matching.dto';
import { RespondMatchingDto } from './dto/respond-matching.dto';
import { MatchingService } from './matching.service';
import {
  estimateProjectWithClaudeOrFallback,
  generateProposalDraftWithClaudeOrFallback,
} from './services/projectEstimateService';

@Controller()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('admin/matching/trigger/:projectId')
  async trigger(
    @Param('projectId') projectId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    await this.matchingService.assertRole(String(userId || ''), 'admin');
    return this.matchingService.triggerMatching(projectId);
  }

  @Get('admin/matching/requests')
  async adminRequests(@Headers('x-user-id') userId?: string) {
    await this.matchingService.assertRole(String(userId || ''), 'admin');
    return this.matchingService.listAllRequests();
  }

  /** Liste tous les projets (invitations matching, expert assigné) — expert ou admin. */
  @Get('matching/expert/catalog')
  async expertCatalog(@Headers('x-user-id') userId?: string) {
    return this.matchingService.getExpertProjectCatalog(String(userId || ''));
  }

  /** Rapport détaillé d’un projet pour expert / admin. */
  @Get('matching/expert/catalog/:projectId')
  async expertCatalogProject(
    @Param('projectId') projectId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.matchingService.getExpertProjectReport(
      projectId,
      String(userId || ''),
    );
  }

  @Get('matching/my-requests')
  async myRequests(@Headers('x-user-id') userId?: string) {
    await this.matchingService.assertRole(String(userId || ''), 'expert');
    return this.matchingService.listMyRequests(String(userId || ''));
  }

  /** Détail d’une demande (projet + client + expert invité / ayant répondu). */
  @Get('matching/my-requests/:requestId')
  async myRequestDetail(
    @Param('requestId') requestId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    await this.matchingService.assertRole(String(userId || ''), 'expert');
    return this.matchingService.getMyRequestById(
      requestId,
      String(userId || ''),
    );
  }

  @Patch('matching/respond/:requestId')
  async respond(
    @Param('requestId') requestId: string,
    @Body() body: RespondMatchingDto,
    @Headers('x-user-id') userId?: string,
  ) {
    await this.matchingService.assertRole(String(userId || ''), 'expert');
    return this.matchingService.respondToRequest(
      requestId,
      String(userId || ''),
      body.response as any,
    );
  }

  /** Expert: aide IA pour estimer budget/durée à partir d'un texte */
  @Post('matching/estimate')
  async estimate(
    @Body() body: EstimateMatchingDto,
    @Headers('x-user-id') userId?: string,
  ) {
    await this.matchingService.assertRole(String(userId || ''), 'expert');
    return estimateProjectWithClaudeOrFallback(body.text);
  }

  /**
   * Expert : brouillon de proposition (prix, durée, notes HTML, matériaux)
   * à partir du contexte projet (texte libre).
   */
  @Post('matching/proposal-draft')
  async proposalDraft(
    @Body() body: EstimateMatchingDto,
    @Headers('x-user-id') userId?: string,
  ) {
    await this.matchingService.assertRole(String(userId || ''), 'expert');
    return generateProposalDraftWithClaudeOrFallback(body.text);
  }
}
