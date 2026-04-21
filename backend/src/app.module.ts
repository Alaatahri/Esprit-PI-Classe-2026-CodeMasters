import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SuiviProjectModule } from './suivi-project/suivi-project.module';
import { DevisModule } from './devis/devis.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MatchingModule } from './matching/matching.module';
import { SuiviModule } from './suivi/suivi.module';
import { AlertsModule } from './alerts/alerts.module';
import { MessagesModule } from './messages/messages.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ContractsModule } from './contracts/contracts.module';
import { AuthModule } from './auth/auth.module';
import { FacturesModule } from './factures/factures.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bmp-tn',
      {
        // MongoDB connection options
      },
    ),
    UserModule,
    AuthModule,
    ProjectModule,
    DashboardModule,
    SuiviProjectModule,
    SuiviModule,
    AlertsModule,
    DevisModule,
    MarketplaceModule,
    MatchingModule,
    MessagesModule,
    ProposalsModule,
    ContractsModule,
    FacturesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
