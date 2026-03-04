import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { SuiviProjectService } from './suivi-project.service';
import { SuiviProject } from './schemas/suivi-project.schema';

@Controller('suivi-projects')
export class SuiviProjectController {
  constructor(private readonly suiviProjectService: SuiviProjectService) {}

  @Post()
  create(@Body() createSuiviDto: Partial<SuiviProject>) {
    return this.suiviProjectService.create(createSuiviDto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    if (projectId) {
      return this.suiviProjectService.findByProject(projectId);
    }
    return this.suiviProjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suiviProjectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSuiviDto: Partial<SuiviProject>) {
    return this.suiviProjectService.update(id, updateSuiviDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suiviProjectService.remove(id);
  }
}
