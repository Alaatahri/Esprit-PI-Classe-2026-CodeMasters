import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  private uid(h?: string): string {
    const id = h?.trim();
    if (!id) throw new BadRequestException('En-tête x-user-id requis.');
    return id;
  }

  @Get('by-project/:projectId')
  byProject(@Param('projectId') projectId: string) {
    return this.proposalsService.findByProject(projectId);
  }

  @Post('for-project/:projectId')
  createForProject(
    @Headers('x-user-id') userId: string | undefined,
    @Param('projectId') projectId: string,
    @Body()
    body: {
      proposedPrice?: number;
      estimatedDurationDays?: number;
      technicalNotes?: string;
      materialSuggestions?: string;
    },
  ) {
    const price = Number(body?.proposedPrice);
    const days = Number(body?.estimatedDurationDays);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Prix invalide.');
    }
    if (!Number.isFinite(days) || days < 1) {
      throw new BadRequestException('Durée invalide.');
    }
    return this.proposalsService.createForProject(projectId, this.uid(userId), {
      proposedPrice: price,
      estimatedDurationDays: days,
      technicalNotes: body?.technicalNotes,
      materialSuggestions: body?.materialSuggestions,
    });
  }

  @Patch(':proposalId/revise')
  revise(
    @Headers('x-user-id') userId: string | undefined,
    @Param('proposalId') proposalId: string,
    @Body()
    body: {
      proposedPrice?: number;
      estimatedDurationDays?: number;
      technicalNotes?: string;
      materialSuggestions?: string;
    },
  ) {
    const price = Number(body?.proposedPrice);
    const days = Number(body?.estimatedDurationDays);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Prix invalide.');
    }
    if (!Number.isFinite(days) || days < 1) {
      throw new BadRequestException('Durée invalide.');
    }
    return this.proposalsService.revise(proposalId, this.uid(userId), {
      proposedPrice: price,
      estimatedDurationDays: days,
      technicalNotes: body?.technicalNotes,
      materialSuggestions: body?.materialSuggestions,
    });
  }

  @Post(':proposalId/counter')
  counter(
    @Headers('x-user-id') userId: string | undefined,
    @Param('proposalId') proposalId: string,
    @Body()
    body: {
      proposedPrice?: number;
      estimatedDurationDays?: number;
      message?: string;
    },
  ) {
    const price = Number(body?.proposedPrice);
    const days = Number(body?.estimatedDurationDays);
    const msg = body?.message?.trim();
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Prix invalide.');
    }
    if (!Number.isFinite(days) || days < 1) {
      throw new BadRequestException('Durée invalide.');
    }
    if (!msg) {
      throw new BadRequestException('Message requis.');
    }
    return this.proposalsService.counter(proposalId, this.uid(userId), {
      proposedPrice: price,
      estimatedDurationDays: days,
      message: msg,
    });
  }
}
