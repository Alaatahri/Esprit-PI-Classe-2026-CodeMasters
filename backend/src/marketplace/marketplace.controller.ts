import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { Types } from 'mongoose';
import { MarketplaceService } from './marketplace.service';
import { Produit } from './schemas/produit.schema';
import { Commande } from './schemas/commande.schema';
import { CommandeItem } from './schemas/commande-item.schema';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // Produit endpoints
  @Post('produits')
  createProduit(@Body() createProduitDto: Partial<Produit>) {
    return this.marketplaceService.createProduit(createProduitDto);
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
  updateProduit(@Param('id') id: string, @Body() updateProduitDto: Partial<Produit>) {
    return this.marketplaceService.updateProduit(id, updateProduitDto);
  }

  @Delete('produits/:id')
  removeProduit(@Param('id') id: string) {
    return this.marketplaceService.removeProduit(id);
  }

  // Commande endpoints
  @Post('commandes')
  createCommande(@Body() createCommandeDto: Partial<Commande>) {
    return this.marketplaceService.createCommande(createCommandeDto);
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
  updateCommande(@Param('id') id: string, @Body() updateCommandeDto: Partial<Commande>) {
    return this.marketplaceService.updateCommande(id, updateCommandeDto);
  }

  @Delete('commandes/:id')
  removeCommande(@Param('id') id: string) {
    return this.marketplaceService.removeCommande(id);
  }

  // CommandeItem endpoints
  @Post('commandes/:id/items')
  createCommandeItem(@Param('id') commandeId: string, @Body() createItemDto: Partial<CommandeItem>) {
    return this.marketplaceService.createCommandeItem({ 
      ...createItemDto, 
      commandeId: new Types.ObjectId(commandeId) 
    });
  }

  @Get('commandes/:id/items')
  findCommandeItems(@Param('id') commandeId: string) {
    return this.marketplaceService.findItemsByCommande(commandeId);
  }

  @Put('commandes/items/:itemId')
  updateCommandeItem(@Param('itemId') itemId: string, @Body() updateItemDto: Partial<CommandeItem>) {
    return this.marketplaceService.updateCommandeItem(itemId, updateItemDto);
  }

  @Delete('commandes/items/:itemId')
  removeCommandeItem(@Param('itemId') itemId: string) {
    return this.marketplaceService.removeCommandeItem(itemId);
  }
}
