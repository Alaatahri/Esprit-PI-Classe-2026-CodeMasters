import { IsString, MinLength } from 'class-validator';

export class EstimateMatchingDto {
  @IsString()
  @MinLength(1)
  text: string;
}
