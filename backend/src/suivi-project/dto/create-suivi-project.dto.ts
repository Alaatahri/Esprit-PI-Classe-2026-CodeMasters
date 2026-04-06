import { Type } from 'class-transformer';
import {
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSuiviProjectDto {
  @IsMongoId()
  projectId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date_suivi?: Date;

  @IsString()
  @MinLength(1)
  description_progression: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  pourcentage_avancement: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cout_actuel: number;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @Type(() => Date)
  uploadedAt?: Date;

  @IsOptional()
  @IsMongoId()
  workerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progressPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  progressIndex?: number;

  @IsOptional()
  @IsString()
  aiAnalysis?: string;
}
