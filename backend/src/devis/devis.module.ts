import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevisController } from './devis.controller';
import { DevisService } from './devis.service';
import { Devis, DevisSchema } from './schemas/devis.schema';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { FacturesModule } from '../factures/factures.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Devis.name, schema: DevisSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    FacturesModule,
  ],
  controllers: [DevisController],
  providers: [DevisService],
  exports: [DevisService],
})
export class DevisModule {}
