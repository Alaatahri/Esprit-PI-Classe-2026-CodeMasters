import { IsNumber, IsOptional } from 'class-validator';

export class GpsDto {
  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
