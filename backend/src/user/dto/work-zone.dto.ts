import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

export type WorkZoneScope = 'tn_all' | 'tn_city' | 'country' | 'world';

export class WorkZoneDto {
  @IsIn(['tn_all', 'tn_city', 'country', 'world'])
  scope: WorkZoneScope;

  @ValidateIf(
    (o: WorkZoneDto) => o.scope === 'tn_city' || o.scope === 'country',
  )
  @IsString()
  @MinLength(1)
  value?: string;
}
