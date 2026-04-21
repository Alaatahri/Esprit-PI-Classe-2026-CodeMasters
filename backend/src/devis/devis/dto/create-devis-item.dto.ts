import { Type } from 'class-transformer';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateDevisItemDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantite: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  prix_unitaire: number;
}
