import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProposalDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  proposedPrice: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  estimatedDurationDays: number;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  technicalNotes: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  materialSuggestions?: string;
}
