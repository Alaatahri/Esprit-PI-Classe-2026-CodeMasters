import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateProposalDto } from './dto/create-proposal.dto';

import { CounterProposalDto } from './dto/counter-proposal.dto';

import { ReviseProposalDto } from './dto/revise-proposal.dto';

import { ProposalsService } from './proposals.service';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get('by-project/:projectId')
  listByProject(@Param('projectId') projectId: string) {
    return this.proposalsService.listByProject(projectId);
  }

  /** Expert assigné: envoie une proposition pour un projet (route statique avant :proposalId) */

  @Post('for-project/:projectId')
  createForProject(
    @Param('projectId') projectId: string,

    @Body() body: CreateProposalDto,

    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = String(expertIdHeader || '').trim();

    return this.proposalsService.createForProject({
      projectId,

      expertId,

      proposedPrice: Number(body?.proposedPrice),

      estimatedDurationDays: Number(body?.estimatedDurationDays),

      technicalNotes: String(body?.technicalNotes ?? ''),

      materialSuggestions: body?.materialSuggestions,
    });
  }

  /** Client : contre-proposition (négociation) */

  @Post(':proposalId/counter')
  counter(
    @Param('proposalId') proposalId: string,

    @Body() body: CounterProposalDto,

    @Headers('x-user-id') clientIdHeader?: string,
  ) {
    const clientId = String(clientIdHeader || '').trim();

    return this.proposalsService.counterByClient({
      proposalId,

      clientId,

      proposedPrice: Number(body?.proposedPrice),

      estimatedDurationDays: Number(body?.estimatedDurationDays),

      message: String(body?.message ?? ''),
    });
  }

  /** Expert : révision après contre-proposition client */

  @Patch(':proposalId/revise')
  revise(
    @Param('proposalId') proposalId: string,

    @Body() body: ReviseProposalDto,

    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = String(expertIdHeader || '').trim();

    return this.proposalsService.reviseByExpert({
      proposalId,

      expertId,

      proposedPrice: Number(body?.proposedPrice),

      estimatedDurationDays: Number(body?.estimatedDurationDays),

      technicalNotes: String(body?.technicalNotes ?? ''),

      materialSuggestions: body?.materialSuggestions,
    });
  }

  /** Client: rejette une proposition */

  @Post(':proposalId/reject')
  reject(
    @Param('proposalId') proposalId: string,

    @Headers('x-user-id') clientIdHeader?: string,
  ) {
    return this.proposalsService.rejectProposal(
      proposalId,
      String(clientIdHeader || ''),
    );
  }
}
