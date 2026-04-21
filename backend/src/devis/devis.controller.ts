import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Headers,
} from '@nestjs/common';
import { DevisService } from './devis.service';
import { FacturesService } from '../factures/factures.service';

@Controller('devis')
export class DevisController {
  constructor(
    private readonly devisService: DevisService,
    private readonly facturesService: FacturesService,
  ) {}

  @Post()
  create(@Body() createDevisDto: any) {
    return this.devisService.create(createDevisDto);
  }

  @Get()
  findAll(@Query() query: any, @Headers() headers: any) {
    const userId = headers['x-user-id'];
    const userRole = headers['x-user-role'];
    const userEmail = headers['x-user-email'];
    return this.devisService.findAll({ ...query, userId, userRole, userEmail });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devisService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDevisDto: any) {
    return this.devisService.update(id, updateDevisDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devisService.remove(id);
  }

  @Post(':id/:endpoint')
  async endpointAction(
    @Param('id') id: string,
    @Param('endpoint') endpoint: string,
  ) {
    const devis = await this.devisService.endpointAction(id, endpoint);
    if (endpoint === 'accepter') {
      // Automatiquement generer une facture
      const facture = await this.facturesService.create({
        titre: 'Facture pour ' + (devis.titre || 'Devis'),
        description: devis.description,
        montant_total: devis.montant_total,
        projectId: devis.projectId,
        clientId: devis.clientId,
        artisanId: devis.artisanId,
        devisId: devis._id,
        temp_client_nom: devis.temp_client_nom,
        temp_client_email: devis.temp_client_email,
        statut: 'envoyée',
      });
      return { devis, facture };
    }
    return devis;
  }
}
