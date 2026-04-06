import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import {
  MatchingRequest,
  MatchingRequestSchema,
} from './schemas/matching-request.schema';
import { Proposal, ProposalSchema } from '../proposals/schemas/proposal.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchingRequest.name, schema: MatchingRequestSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Proposal.name, schema: ProposalSchema },
    ]),
  ],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
