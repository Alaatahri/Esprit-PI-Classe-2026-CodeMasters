import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProduitDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  prix: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsMongoId()
  vendeurId: string;
}
