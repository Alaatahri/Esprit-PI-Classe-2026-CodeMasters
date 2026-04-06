import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { Produit, ProduitSchema } from './schemas/produit.schema';
import { Commande, CommandeSchema } from './schemas/commande.schema';
import {
  CommandeItem,
  CommandeItemSchema,
} from './schemas/commande-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Produit.name, schema: ProduitSchema },
      { name: Commande.name, schema: CommandeSchema },
      { name: CommandeItem.name, schema: CommandeItemSchema },
    ]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
