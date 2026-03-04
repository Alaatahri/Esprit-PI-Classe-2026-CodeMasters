// backend/src/ai-matching/ai-matching.controller.ts
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { AiMatchingService } from './ai-matching.service';

@Controller('ai-matching')
export class AiMatchingController {
  constructor(private readonly aiMatchingService: AiMatchingService) {}

  @Post('projet/:projectId/match')
  async matcherExperts(
    @Param('projectId') projectId: string,
    @Body() body: { competences_requises: string[]; top_n?: number },
  ) {
    try {
      const experts = await this.aiMatchingService.matcherExperts(
        projectId,
        body.competences_requises || [],
        body.top_n || 3,
      );

      return {
        success: true,
        project_id: projectId,
        experts_recommandes: experts,
        total: experts.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('projet/:projectId/match-selection')
  async matcherExpertsParIds(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      expert_ids: string[];
      competences_requises: string[];
      top_n?: number;
    },
  ) {
    try {
      const experts = await this.aiMatchingService.matcherExpertsParIds(
        projectId,
        body.expert_ids || [],
        body.competences_requises || [],
        body.top_n || 3,
      );

      return {
        success: true,
        project_id: projectId,
        experts_recommandes: experts,
        total: experts.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('health')
  async checkHealth() {
    try {
      const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
      const res = await fetch(`${AI_URL}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      const data: any = await res.json();
      return {
        nestjs: 'ok',
        python_flask: data.status === 'ok' ? 'ok' : 'erreur',
        flask_url: AI_URL,
      };
    } catch {
      return {
        nestjs: 'ok',
        python_flask: 'indisponible',
        flask_url: process.env.AI_SERVICE_URL || 'http://localhost:5001',
      };
    }
  }
}
