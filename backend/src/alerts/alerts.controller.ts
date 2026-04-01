import { Body, Controller, Headers, Param, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertResponseDto } from './dto/alert-response.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Réponse ouvrier à une alerte retard.
   *
   * @param alertId ID de l’alerte
   * @param userId Header `x-user-id` (ouvrier)
   * @param dto Corps validé
   * @returns Alerte mise à jour
   */
  @Put(':alertId/response')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async respond(
    @Param('alertId') alertId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Body() dto: AlertResponseDto,
  ) {
    return this.alertsService.setWorkerResponse(alertId, String(userId || ''), dto);
  }
}
