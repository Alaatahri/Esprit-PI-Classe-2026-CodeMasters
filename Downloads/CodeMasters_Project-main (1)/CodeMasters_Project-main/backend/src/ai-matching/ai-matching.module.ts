// backend/src/ai-matching/ai-matching.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiMatchingController } from './ai-matching.controller';
import { AiMatchingService } from './ai-matching.service';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Project, ProjectSchema } from '../project/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [AiMatchingController],
  providers: [AiMatchingService],
  exports: [AiMatchingService], // exporté pour ProjectModule si besoin
})
export class AiMatchingModule {}
