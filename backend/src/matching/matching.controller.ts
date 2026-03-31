import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { MatchingService } from './matching.service';

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

  @Get('matching/my-requests')
  async myRequests(@Headers('x-user-id') userId?: string) {
    await this.matchingService.assertRole(String(userId || ''), 'expert');
    return this.matchingService.listMyRequests(String(userId || ''));
  }

  @Patch('matching/respond/:requestId')
  async respond(
    @Param('requestId') requestId: string,
    @Headers('x-user-id') userId?: string,
    @Body() body?: { response?: 'accepted' | 'refused' },
  ) {
    await this.matchingService.assertRole(String(userId || ''), 'expert');
    return this.matchingService.respondToRequest(
      requestId,
      String(userId || ''),
      body?.response as any,
    );
  }
}

