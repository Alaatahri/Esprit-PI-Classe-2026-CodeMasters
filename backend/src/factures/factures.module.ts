import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FacturesController } from './factures.controller';
import { FacturesService } from './factures.service';
import { Facture, FactureSchema } from './schemas/facture.schema';
import { Paiement, PaiementSchema } from './schemas/paiement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Facture.name, schema: FactureSchema },
      { name: Paiement.name, schema: PaiementSchema },
    ]),
  ],
  controllers: [FacturesController],
  providers: [FacturesService],
  exports: [FacturesService],
})
export class FacturesModule {}
