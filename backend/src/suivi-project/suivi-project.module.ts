import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SuiviProjectController } from './suivi-project.controller';
import { SuiviProjectService } from './suivi-project.service';
import { SuiviProject, SuiviProjectSchema } from './schemas/suivi-project.schema';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SuiviProject.name, schema: SuiviProjectSchema },
    ]),
    ProjectModule,
  ],
  controllers: [SuiviProjectController],
  providers: [SuiviProjectService],
  exports: [SuiviProjectService],
})
export class SuiviProjectModule {}
