import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsModule } from '../alerts/alerts.module';
import { ProjectModule } from '../project/project.module';
import { SuiviController } from './suivi.controller';
import { SuiviService } from './suivi.service';
import { Suivi, SuiviSchema } from './schemas/suivi.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Suivi.name, schema: SuiviSchema }]),
    ProjectModule,
    AlertsModule,
  ],
  controllers: [SuiviController],
  providers: [SuiviService],
  exports: [SuiviService],
})
export class SuiviModule {}
