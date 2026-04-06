import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Corps attendu pour `PUT /api/alerts/:alertId/response`.
 */
export class AlertResponseDto {
  @IsIn(['solution', 'estimatedDate'])
  type: 'solution' | 'estimatedDate';

  @IsString()
  @MinLength(1, { message: 'message est requis' })
  message: string;

  @IsOptional()
  @IsDateString()
  estimatedDate?: string;
}
