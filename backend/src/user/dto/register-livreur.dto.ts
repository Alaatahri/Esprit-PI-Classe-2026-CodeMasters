import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { WorkZoneDto } from './work-zone.dto';

const TRANSPORTS = ['velo', 'moto', 'voiture', 'camionnette'] as const;

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const j = JSON.parse(value) as unknown;
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}

export class RegisterLivreurDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail(
    { allow_utf8_local_part: false },
    { message: 'Adresse e-mail invalide.' },
  )
  email: string;

  @IsString()
  @MinLength(6)
  mot_de_passe: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  telephone?: string;

  @IsIn([...TRANSPORTS], {
    message: 'Moyen de transport invalide (Vélo, Moto, Voiture, Camionnette).',
  })
  moyen_transport: (typeof TRANSPORTS)[number];

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @ArrayMinSize(1, { message: 'Indiquez au moins une zone de livraison.' })
  @ValidateNested({ each: true })
  @Type(() => WorkZoneDto)
  zones_livraison: WorkZoneDto[];

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @ArrayMinSize(1, { message: 'Choisissez au moins une disponibilité.' })
  @IsString({ each: true })
  @IsIn(['temps_plein', 'temps_partiel', 'weekend'], { each: true })
  livreur_disponibilite: string[];
}
