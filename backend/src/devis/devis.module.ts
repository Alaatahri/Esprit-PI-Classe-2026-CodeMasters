import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevisController } from './devis.controller';
import { DevisService } from './devis.service';
import { Devis, DevisSchema } from './schemas/devis.schema';
import { DevisItem, DevisItemSchema } from './schemas/devis-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Devis.name, schema: DevisSchema },
      { name: DevisItem.name, schema: DevisItemSchema },
    ]),
  ],
  controllers: [DevisController],
  providers: [DevisService],
  exports: [DevisService],
})
export class DevisModule {}
