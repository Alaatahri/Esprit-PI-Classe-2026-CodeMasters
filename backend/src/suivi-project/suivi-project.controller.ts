import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CreateSuiviProjectDto } from './dto/create-suivi-project.dto';
import { UpdateSuiviProjectDto } from './dto/update-suivi-project.dto';
import { SuiviProject } from './schemas/suivi-project.schema';
import { SuiviProjectService } from './suivi-project.service';

@Controller('suivi-projects')
export class SuiviProjectController {
  constructor(private readonly suiviProjectService: SuiviProjectService) {}

  @Post()
  create(@Body() createSuiviDto: CreateSuiviProjectDto) {
    return this.suiviProjectService.create(
      createSuiviDto as unknown as Partial<SuiviProject>,
    );
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
  update(
    @Param('id') id: string,
    @Body() updateSuiviDto: UpdateSuiviProjectDto,
  ) {
    return this.suiviProjectService.update(
      id,
      updateSuiviDto as unknown as Partial<SuiviProject>,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suiviProjectService.remove(id);
  }
}
