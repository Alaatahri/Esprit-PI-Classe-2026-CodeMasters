import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { FacturesService } from './factures.service';

@Controller('factures')
export class FacturesController {
  constructor(private readonly facturesService: FacturesService) {}

  @Post()
  create(@Body() createFactureDto: any) {
    return this.facturesService.create(createFactureDto);
  }

  @Get()
  findAll(@Query() query: any, @Headers() headers: any) {
    const userId = headers['x-user-id'];
    const userRole = headers['x-user-role'];
    const userEmail = headers['x-user-email'];
    return this.facturesService.findAll({ ...query, userId, userRole, userEmail });
  }

  @Get('paiements/all')
  findAllPaiements(@Headers() headers: any) {
    const userId = headers['x-user-id'];
    const userRole = headers['x-user-role'];
    const userEmail = headers['x-user-email'];
    return this.facturesService.findAllPaiements({ userId, userRole, userEmail });
  }

  @Get('paiements/stats')
  getPaiementStats(@Headers() headers: any) {
    const userId = headers['x-user-id'];
    const userRole = headers['x-user-role'];
    const userEmail = headers['x-user-email'];
    return this.facturesService.getPaiementStats({ userId, userRole, userEmail });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facturesService.findOne(id);
  }

  @Post(':id/paiements')
  addPaiement(@Param('id') id: string, @Body() paiementDto: any) {
    return this.facturesService.addPaiement(id, paiementDto);
  }

  @Get(':id/paiements')
  findPayments(@Param('id') id: string) {
    return this.facturesService.findPaymentsByFactureId(id);
  }

  @Post(':id/:endpoint')
  endpointAction(@Param('id') id: string, @Param('endpoint') endpoint: string) {
    return this.facturesService.endpointAction(id, endpoint);
  }
}
