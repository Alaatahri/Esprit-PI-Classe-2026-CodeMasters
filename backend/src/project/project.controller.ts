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
}
