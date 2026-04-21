import { Body, Controller, Post } from '@nestjs/common';
import { SuiviPhotoDto } from './dto/suivi-photo.dto';
import { SuiviService } from './suivi.service';

@Controller('suivi')
export class SuiviController {
  constructor(private readonly suiviService: SuiviService) {}

  /**
   * Crée une entrée de suivi photo pour un projet, calcule un progress global non décroissant
   * et sauvegarde l'analyse IA (ou fallback).
   *
   * @param body Données de suivi (projectId, workerId, photoUrl, photoBase64 optionnel)
   * @returns L'entrée créée + percent/reason de l'IA
   */
  @Post('photo')
  async uploadPhotoProgress(@Body() body: SuiviPhotoDto) {
    return this.suiviService.createPhotoProgress(body);
  }
}
