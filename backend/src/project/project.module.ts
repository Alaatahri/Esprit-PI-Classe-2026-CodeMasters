import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ApplicationsController } from './applications.controller';
import { ProjectService } from './project.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { SuiviProjectModule } from '../suivi-project/suivi-project.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => SuiviProjectModule),
    MatchingModule,
  ],
  controllers: [ProjectController, ApplicationsController],
  providers: [ProjectService],
  // Ré-exporte le modèle Project pour les modules qui importent ProjectModule (ex. SuiviModule)
  exports: [MongooseModule, ProjectService],
})
export class ProjectModule {}
