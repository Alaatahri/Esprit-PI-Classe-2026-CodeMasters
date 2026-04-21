import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GpsDto } from './gps.dto';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  titre: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsMongoId()
  clientId: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GpsDto)
  gps?: GpsDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  surface_m2?: number;

  @IsOptional()
  @IsString()
  type_batiment?: string;

  @IsOptional()
  @IsIn(['urgent', 'normal', 'flexible'])
  urgence?: 'urgent' | 'normal' | 'flexible';

  @IsOptional()
  @IsString()
  preferences_materiaux?: string;

  @IsOptional()
  @IsString()
  exigences_techniques?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budget_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budget_max?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pieces_jointes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos_site?: string[];

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  avancement_global?: number;
}
