import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateDevisDto {
  @IsMongoId()
  projectId: string;

  @IsMongoId()
  clientId: string;

  @IsMongoId()
  expertId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montant_total: number;

  @IsOptional()
  @IsIn(['En attente', 'Accepté', 'Refusé'])
  statut?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date_creation?: Date;
}
