import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
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

  @Get('client/:clientId/completed')
  findCompletedByClient(@Param('clientId') clientId: string) {
    return this.projectService.findCompletedByClient(clientId);
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
}
