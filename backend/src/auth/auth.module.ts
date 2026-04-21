import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { CvAnalysisService } from './cv-analysis.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [CvAnalysisService],
})
export class AuthModule {}
