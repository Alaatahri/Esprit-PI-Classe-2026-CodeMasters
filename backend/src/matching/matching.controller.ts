import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  private uid(h?: string): string {
    const id = h?.trim();
    if (!id) throw new BadRequestException('En-tête x-user-id requis.');
    return id;
  }

  @Get('my-requests')
  myRequests(@Headers('x-user-id') userId?: string) {
    return this.matchingService.listForExpert(this.uid(userId));
  }

  @Get('my-requests/:requestId')
  myRequestDetail(
    @Headers('x-user-id') userId: string | undefined,
    @Param('requestId') requestId: string,
  ) {
    return this.matchingService.getDetailForExpert(
      requestId,
      this.uid(userId),
    );
  }

  @Patch('respond/:requestId')
  respond(
    @Headers('x-user-id') userId: string | undefined,
    @Param('requestId') requestId: string,
    @Body() body: { response?: string },
  ) {
    const r = body?.response;
    if (r !== 'accepted' && r !== 'refused') {
      throw new BadRequestException('response doit être accepted ou refused.');
    }
    return this.matchingService.respond(
      requestId,
      this.uid(userId),
      r,
    );
  }

  @Post('proposal-draft')
  proposalDraft(
    @Body() body: { text?: string },
    @Headers('x-user-id') userId?: string,
  ) {
    this.uid(userId);
    return this.matchingService.proposalDraft(body?.text ?? '');
  }
}

@Controller('admin/matching')
export class AdminMatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('requests')
  requests(@Query('projectId') projectId?: string) {
    return this.matchingService.adminListPending({ projectId });
  }

  @Get('projects/:projectId')
  projectOverview(@Param('projectId') projectId: string) {
    return this.matchingService.adminProjectOverview(projectId);
  }

  @Post('projects/:projectId/invite')
  inviteExpert(
    @Param('projectId') projectId: string,
    @Body()
    body: { expertId?: string; matchScore?: number; expiresInDays?: number },
  ) {
    return this.matchingService.adminInviteExpert(projectId, body);
  }

  @Post('projects/:projectId/auto-match')
  autoMatch(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      limit?: number;
      expiresInDays?: number;
      minScore?: number;
      aiUrl?: string;
      aiKey?: string;
    },
  ) {
    return this.matchingService.adminAutoMatch(projectId, body);
  }
}
