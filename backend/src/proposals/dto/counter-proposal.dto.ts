import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CounterProposalDto {
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
  @MaxLength(8000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientName?: string;
}
