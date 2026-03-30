import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Produit, ProduitDocument } from './schemas/produit.schema';
import { Commande, CommandeDocument } from './schemas/commande.schema';
import { CommandeItem, CommandeItemDocument } from './schemas/commande-item.schema';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectModel(Produit.name) private produitModel: Model<ProduitDocument>,
    @InjectModel(Commande.name) private commandeModel: Model<CommandeDocument>,
    @InjectModel(CommandeItem.name) private commandeItemModel: Model<CommandeItemDocument>,
  ) {}

  // Produit methods
  async createProduit(createProduitDto: Partial<Produit>): Promise<Produit> {
    const createdProduit = new this.produitModel(createProduitDto);
    return createdProduit.save();
  }

  async findAllProduits(): Promise<Produit[]> {
    return this.produitModel.find().exec();
  }

  async findProduitById(id: string): Promise<Produit> {
    return this.produitModel.findById(id).exec();
  }

  async updateProduit(id: string, updateProduitDto: Partial<Produit>): Promise<Produit> {
    return this.produitModel.findByIdAndUpdate(id, updateProduitDto, { new: true }).exec();
  }

  async removeProduit(id: string): Promise<Produit> {
    return this.produitModel.findByIdAndDelete(id).exec();
  }

  // Commande methods
  async createCommande(createCommandeDto: Partial<Commande>): Promise<Commande> {
    const createdCommande = new this.commandeModel(createCommandeDto);
    return createdCommande.save();
  }

  async findAllCommandes(): Promise<Commande[]> {
    return this.commandeModel.find().exec();
  }

  async findCommandeById(id: string): Promise<Commande> {
    return this.commandeModel.findById(id).exec();
  }

  async findByClient(clientId: string): Promise<Commande[]> {
    return this.commandeModel.find({ clientId }).exec();
  }

  async updateCommande(id: string, updateCommandeDto: Partial<Commande>): Promise<Commande> {
    return this.commandeModel.findByIdAndUpdate(id, updateCommandeDto, { new: true }).exec();
  }

  async removeCommande(id: string): Promise<Commande> {
    // Also delete related items
    await this.commandeItemModel.deleteMany({ commandeId: id }).exec();
    return this.commandeModel.findByIdAndDelete(id).exec();
  }

  // CommandeItem methods
  async createCommandeItem(createItemDto: Partial<CommandeItem>): Promise<CommandeItem> {
    const createdItem = new this.commandeItemModel(createItemDto);
    const savedItem = await createdItem.save();

    // Update commande montant_total
    await this.updateCommandeTotal(createItemDto.commandeId.toString());

    return savedItem;
  }

  async findItemsByCommande(commandeId: string): Promise<CommandeItem[]> {
    return this.commandeItemModel.find({ commandeId }).exec();
  }

  async updateCommandeItem(id: string, updateItemDto: Partial<CommandeItem>): Promise<CommandeItem> {
    const updatedItem = await this.commandeItemModel.findByIdAndUpdate(
      id,
      updateItemDto,
      { new: true }
    ).exec();

    if (updatedItem) {
      await this.updateCommandeTotal(updatedItem.commandeId.toString());
    }

    return updatedItem;
  }

  async removeCommandeItem(id: string): Promise<CommandeItem> {
    const item = await this.commandeItemModel.findById(id).exec();
    const deletedItem = await this.commandeItemModel.findByIdAndDelete(id).exec();

    if (deletedItem && item) {
      await this.updateCommandeTotal(item.commandeId.toString());
    }

    return deletedItem;
  }

  private async updateCommandeTotal(commandeId: string): Promise<void> {
    const items = await this.commandeItemModel.find({ commandeId }).exec();
    const total = items.reduce((sum, item) => sum + item.quantite * item.prix, 0);
    await this.commandeModel.findByIdAndUpdate(commandeId, { montant_total: total }).exec();
  }
}
