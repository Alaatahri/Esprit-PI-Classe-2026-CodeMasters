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

@Module({
  imports: [
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
    SuiviModule,
    AlertsModule,
    DevisModule,
    MarketplaceModule,
    MatchingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
