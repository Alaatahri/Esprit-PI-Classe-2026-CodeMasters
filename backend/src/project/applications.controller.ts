import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('me')
  findMyApplications(
    @Query('artisanId') artisanIdFromQuery?: string,
    @Headers('x-user-id') artisanIdFromHeader?: string,
  ) {
    const artisanId = artisanIdFromQuery || artisanIdFromHeader;

    if (!artisanId) {
      return [];
    }

    return this.projectService.findApplicationsForArtisan(artisanId);
  }

  @Post(':id/accept')
  acceptApplication(
    @Param('id') id: string,
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = String(expertIdHeader || '').trim();
    if (!expertId) {
      throw new ForbiddenException(
        'En-tête x-user-id requis (expert connecté).',
      );
    }
    return this.projectService.updateApplicationStatus(
      id,
      'acceptee',
      expertId,
    );
  }

  @Post(':id/decline')
  declineApplication(
    @Param('id') id: string,
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = String(expertIdHeader || '').trim();
    if (!expertId) {
      throw new ForbiddenException(
        'En-tête x-user-id requis (expert connecté).',
      );
    }
    return this.projectService.updateApplicationStatus(id, 'refusee', expertId);
  }
}
