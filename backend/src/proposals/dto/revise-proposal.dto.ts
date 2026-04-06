import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReviseProposalDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  proposedPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(3650)
  estimatedDurationDays: number;

  @IsString()
  @MaxLength(50000)
  technicalNotes: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  materialSuggestions?: string;
}
