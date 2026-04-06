import { IsMongoId, IsOptional } from 'class-validator';

export class ApplyProjectDto {
  @IsOptional()
  @IsMongoId()
  artisanId?: string;
}
