import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ProjectModule, UserModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
