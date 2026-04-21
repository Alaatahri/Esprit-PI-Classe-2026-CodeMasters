import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
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

  /** Vitrine — avant @Get(':id') sinon « public » est capturé comme id. */
  @Get('public/showcase')
  @Header(
    'Cache-Control',
    'public, max-age=20, s-maxage=30, stale-while-revalidate=120',
  )
  publicShowcase() {
    return this.projectService.findPublicShowcase();
  }

  @Get('public/showcase/:id')
  @Header(
    'Cache-Control',
    'public, max-age=15, s-maxage=20, stale-while-revalidate=60',
  )
  publicShowcaseById(@Param('id') id: string) {
    return this.projectService.findPublicShowcaseById(id);
  }

  /** Projets assignés à un expert — avant @Get(':id') pour ne pas capturer « expert » comme id. */
  @Get('expert/:expertId')
  findByExpert(@Param('expertId') expertId: string) {
    return this.projectService.findByExpertId(expertId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: Partial<Project>) {
    return this.projectService.update(id, updateProjectDto);
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

  @Post(':id/expert/manual-progress')
  expertManualProgress(
    @Param('id') id: string,
    @Body() body: { avancement?: number; note?: string },
    @Headers('x-user-id') expertId?: string,
  ) {
    const uid = expertId?.trim();
    if (!uid) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    const av = Number(body?.avancement);
    if (!Number.isFinite(av) || av < 0 || av > 100) {
      throw new BadRequestException('Avancement entre 0 et 100.');
    }
    return this.projectService.assertExpertAndUpdateProgress(
      id,
      uid,
      Math.round(av),
    );
  }
}
