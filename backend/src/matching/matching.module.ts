import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectModule } from '../project/project.module';
import { ProposalsModule } from '../proposals/proposals.module';
import { UserModule } from '../user/user.module';
import {
  MatchingRequest,
  MatchingRequestSchema,
} from './schemas/matching-request.schema';
import { MatchingService } from './matching.service';
import {
  AdminMatchingController,
  MatchingController,
} from './matching.controller';
import { MatchingExpertCatalogController } from './matching-expert-catalog.controller';
import { MatchingScheduler } from './matching.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchingRequest.name, schema: MatchingRequestSchema },
    ]),
    ProjectModule,
    ProposalsModule,
    UserModule,
  ],
  controllers: [
    MatchingController,
    AdminMatchingController,
    MatchingExpertCatalogController,
  ],
  providers: [MatchingService, MatchingScheduler],
  exports: [MatchingService],
})
export class MatchingModule {}
