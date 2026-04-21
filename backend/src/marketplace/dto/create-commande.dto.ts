import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateCommandeDto {
  @IsMongoId()
  clientId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montant_total: number;

  @IsOptional()
  @IsIn(['En attente', 'Payée', 'Livrée'])
  statut?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date_commande?: Date;
}
