import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { CreateCommandeItemDto } from './dto/create-commande-item.dto';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';
import { UpdateCommandeItemDto } from './dto/update-commande-item.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { Commande } from './schemas/commande.schema';
import { CommandeItem } from './schemas/commande-item.schema';
import { Produit } from './schemas/produit.schema';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // Produit endpoints
  @Post('produits')
  createProduit(@Body() createProduitDto: CreateProduitDto) {
    return this.marketplaceService.createProduit(
      createProduitDto as unknown as Partial<Produit>,
    );
  }

  @Get('produits')
  findAllProduits() {
    return this.marketplaceService.findAllProduits();
  }

  @Get('produits/:id')
  findProduitById(@Param('id') id: string) {
    return this.marketplaceService.findProduitById(id);
  }

  @Put('produits/:id')
  updateProduit(
    @Param('id') id: string,
    @Body() updateProduitDto: UpdateProduitDto,
  ) {
    return this.marketplaceService.updateProduit(
      id,
      updateProduitDto as unknown as Partial<Produit>,
    );
  }

  @Delete('produits/:id')
  removeProduit(@Param('id') id: string) {
    return this.marketplaceService.removeProduit(id);
  }

  // Commande endpoints
  @Post('commandes')
  createCommande(@Body() createCommandeDto: CreateCommandeDto) {
    return this.marketplaceService.createCommande(
      createCommandeDto as unknown as Partial<Commande>,
    );
  }

  @Get('commandes')
  findAllCommandes(@Query('clientId') clientId?: string) {
    if (clientId) {
      return this.marketplaceService.findByClient(clientId);
    }
    return this.marketplaceService.findAllCommandes();
  }

  @Get('commandes/:id')
  findCommandeById(@Param('id') id: string) {
    return this.marketplaceService.findCommandeById(id);
  }

  @Put('commandes/:id')
  updateCommande(
    @Param('id') id: string,
    @Body() updateCommandeDto: UpdateCommandeDto,
  ) {
    return this.marketplaceService.updateCommande(
      id,
      updateCommandeDto as unknown as Partial<Commande>,
    );
  }

  @Delete('commandes/:id')
  removeCommande(@Param('id') id: string) {
    return this.marketplaceService.removeCommande(id);
  }

  // CommandeItem endpoints
  @Post('commandes/:id/items')
  createCommandeItem(
    @Param('id') commandeId: string,
    @Body() createItemDto: CreateCommandeItemDto,
  ) {
    return this.marketplaceService.createCommandeItem({
      ...(createItemDto as unknown as Partial<CommandeItem>),
      commandeId: new Types.ObjectId(commandeId),
    });
  }

  @Get('commandes/:id/items')
  findCommandeItems(@Param('id') commandeId: string) {
    return this.marketplaceService.findItemsByCommande(commandeId);
  }

  @Put('commandes/items/:itemId')
  updateCommandeItem(
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateCommandeItemDto,
  ) {
    return this.marketplaceService.updateCommandeItem(
      itemId,
      updateItemDto as unknown as Partial<CommandeItem>,
    );
  }

  @Delete('commandes/items/:itemId')
  removeCommandeItem(@Param('itemId') itemId: string) {
    return this.marketplaceService.removeCommandeItem(itemId);
  }
}
