import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ApplicationsController } from './applications.controller';
import { ProjectService } from './project.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { SuiviProjectModule } from '../suivi-project/suivi-project.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    forwardRef(() => SuiviProjectModule),
  ],
  controllers: [ProjectController, ApplicationsController],
  providers: [ProjectService],
  // Ré-exporte le modèle Project pour les modules qui importent ProjectModule (ex. SuiviModule)
  exports: [MongooseModule, ProjectService],
})
export class ProjectModule {}
