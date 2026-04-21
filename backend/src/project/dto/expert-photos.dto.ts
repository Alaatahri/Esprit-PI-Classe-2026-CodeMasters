import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class ExpertPhotosDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  urls?: string[];

  @IsOptional()
  @IsIn(['avant', 'apres'])
  album?: 'avant' | 'apres';
}
