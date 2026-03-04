import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { Types } from 'mongoose';
import { DevisService } from './devis.service';
import { Devis } from './schemas/devis.schema';
import { DevisItem } from './schemas/devis-item.schema';

@Controller('devis')
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Post()
  create(@Body() createDevisDto: Partial<Devis>) {
    return this.devisService.create(createDevisDto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    if (projectId) {
      return this.devisService.findByProject(projectId);
    }
    return this.devisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devisService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDevisDto: Partial<Devis>) {
    return this.devisService.update(id, updateDevisDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devisService.remove(id);
  }

  // DevisItem endpoints
  @Post(':id/items')
  createItem(@Param('id') devisId: string, @Body() createItemDto: Partial<DevisItem>) {
    return this.devisService.createItem({ 
      ...createItemDto, 
      devisId: new Types.ObjectId(devisId) 
    });
  }

  @Get(':id/items')
  findItems(@Param('id') devisId: string) {
    return this.devisService.findItemsByDevis(devisId);
  }

  @Put('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() updateItemDto: Partial<DevisItem>) {
    return this.devisService.updateItem(itemId, updateItemDto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.devisService.removeItem(itemId);
  }
}
