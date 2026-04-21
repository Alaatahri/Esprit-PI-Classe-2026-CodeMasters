import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SuiviProjectModule } from './suivi-project/suivi-project.module';
import { DevisModule } from './devis/devis.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MessagesModule } from './messages/messages.module';
import { MatchingModule } from './matching/matching.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bmp-tn',
      {
        // MongoDB connection options
      },
    ),
    UserModule,
    ProjectModule,
    DashboardModule,
    SuiviProjectModule,
    DevisModule,
    MarketplaceModule,
    MessagesModule,
    MatchingModule,
    ProposalsModule,
    ContractsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
