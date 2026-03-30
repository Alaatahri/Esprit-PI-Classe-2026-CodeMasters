import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Devis, DevisDocument } from './schemas/devis.schema';
import { DevisItem, DevisItemDocument } from './schemas/devis-item.schema';

@Injectable()
export class DevisService {
  constructor(
    @InjectModel(Devis.name) private devisModel: Model<DevisDocument>,
    @InjectModel(DevisItem.name) private devisItemModel: Model<DevisItemDocument>,
  ) {}

  async create(createDevisDto: Partial<Devis>): Promise<Devis> {
    const createdDevis = new this.devisModel(createDevisDto);
    return createdDevis.save();
  }

  async findAll(): Promise<Devis[]> {
    return this.devisModel.find().exec();
  }

  async findByProject(projectId: string): Promise<Devis[]> {
    return this.devisModel.find({ projectId }).exec();
  }

  async findOne(id: string): Promise<Devis> {
    return this.devisModel.findById(id).exec();
  }

  async update(id: string, updateDevisDto: Partial<Devis>): Promise<Devis> {
    return this.devisModel.findByIdAndUpdate(id, updateDevisDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Devis> {
    // Also delete related items
    await this.devisItemModel.deleteMany({ devisId: id }).exec();
    return this.devisModel.findByIdAndDelete(id).exec();
  }

  // DevisItem methods
  async createItem(createItemDto: Partial<DevisItem>): Promise<DevisItem> {
    const createdItem = new this.devisItemModel(createItemDto);
    const savedItem = await createdItem.save();

    // Update devis montant_total
    await this.updateDevisTotal(createItemDto.devisId.toString());

    return savedItem;
  }

  async findItemsByDevis(devisId: string): Promise<DevisItem[]> {
    return this.devisItemModel.find({ devisId }).exec();
  }

  async updateItem(id: string, updateItemDto: Partial<DevisItem>): Promise<DevisItem> {
    const updatedItem = await this.devisItemModel.findByIdAndUpdate(
      id,
      updateItemDto,
      { new: true }
    ).exec();

    if (updatedItem) {
      await this.updateDevisTotal(updatedItem.devisId.toString());
    }

    return updatedItem;
  }

  async removeItem(id: string): Promise<DevisItem> {
    const item = await this.devisItemModel.findById(id).exec();
    const deletedItem = await this.devisItemModel.findByIdAndDelete(id).exec();

    if (deletedItem && item) {
      await this.updateDevisTotal(item.devisId.toString());
    }

    return deletedItem;
  }

  private async updateDevisTotal(devisId: string): Promise<void> {
    const items = await this.devisItemModel.find({ devisId }).exec();
    const total = items.reduce(
      (sum, item) => sum + item.quantite * item.prix_unitaire,
      0
    );
    await this.devisModel.findByIdAndUpdate(devisId, { montant_total: total }).exec();
  }
}
