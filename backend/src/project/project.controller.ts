import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './schemas/project.schema';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: Partial<Project>) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get('public/showcase')
  showcaseProjects() {
    return this.projectService.findShowcaseProjects(24);
  }

  @Get('public/showcase/:id')
  showcaseProjectById(@Param('id') id: string) {
    return this.projectService.findPublicShowcaseById(id);
  }

  /** Expert assigné : ajoute des URLs aux albums avant/après (en-tête x-user-id = id expert). */
  @Post(':id/expert/photos')
  appendExpertPhotos(
    @Param('id') id: string,
    @Body() body: { urls?: string[]; album?: 'avant' | 'apres' },
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = expertIdHeader?.trim();
    if (!expertId) {
      throw new BadRequestException(
        'En-tête x-user-id requis (identifiant de l’expert connecté).',
      );
    }
    const urls = Array.isArray(body?.urls) ? body.urls : [];
    const album = body?.album === 'avant' ? 'avant' : 'apres';
    return this.projectService.appendExpertProjectPhotos(id, expertId, {
      urls,
      album,
    });
  }

  @Post(':id/expert/feedback')
  setExpertFeedback(
    @Param('id') id: string,
    @Body() body: { text?: string },
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = expertIdHeader?.trim();
    if (!expertId) {
      throw new BadRequestException(
        'En-tête x-user-id requis (identifiant de l’expert connecté).',
      );
    }
    return this.projectService.setExpertProjectFeedback(
      id,
      expertId,
      String(body?.text ?? ''),
    );
  }

  @Get('expert/:expertId')
  findByExpert(@Param('expertId') expertId: string) {
    return this.projectService.findByExpertId(expertId);
  }

  @Get('client/:clientId/completed')
  findCompletedByClient(@Param('clientId') clientId: string) {
    return this.projectService.findCompletedByClient(clientId);
  }

  @Get('artisan/:artisanId')
  findAcceptedByArtisan(@Param('artisanId') artisanId: string) {
    return this.projectService.findAcceptedByArtisan(artisanId);
  }

  @Get('artisan/:artisanId/completed')
  findCompletedByArtisan(@Param('artisanId') artisanId: string) {
    return this.projectService.findCompletedByArtisan(artisanId);
  }

  @Get('mine-as-artisan')
  findMineAsArtisan(
    @Query('artisanId') artisanIdFromQuery?: string,
    @Headers('x-user-id') artisanIdFromHeader?: string,
  ) {
    const artisanId = artisanIdFromQuery || artisanIdFromHeader;
    if (!artisanId) return [];
    return this.projectService.findAcceptedByArtisan(artisanId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: Partial<Project>) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Post(':id/rate')
  rateProject(
    @Param('id') id: string,
    @Body()
    rating: {
      clientRating?: number;
      clientComment?: string;
      expertRating?: number;
      artisanRating?: number;
    },
  ) {
    return this.projectService.rateProject(id, rating);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  @Post(':id/apply')
  applyToProject(
    @Param('id') id: string,
    @Body() body: { artisanId?: string },
    @Query('artisanId') artisanIdFromQuery?: string,
    @Headers('x-user-id') artisanIdFromHeader?: string,
  ) {
    const artisanId =
      body?.artisanId || artisanIdFromQuery || artisanIdFromHeader;

    if (!artisanId) {
      throw new BadRequestException('artisanId est requis pour postuler.');
    }

    return this.projectService.applyToProject(id, artisanId);
  }
}
