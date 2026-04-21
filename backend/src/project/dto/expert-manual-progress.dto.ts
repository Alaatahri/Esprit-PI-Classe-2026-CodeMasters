import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExpertManualProgressDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  avancement: number;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  note?: string;
}
