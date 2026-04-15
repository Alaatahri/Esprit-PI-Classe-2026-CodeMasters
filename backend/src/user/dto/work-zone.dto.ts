import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

export type WorkZoneScope =
  | 'tn_all'
  | 'tn_city'
  | 'tn_region'
  | 'country'
  | 'world';

export class WorkZoneDto {
  @IsIn(['tn_all', 'tn_city', 'tn_region', 'country', 'world'])
  scope: WorkZoneScope;

  @ValidateIf(
    (o: WorkZoneDto) =>
      o.scope === 'tn_city' ||
      o.scope === 'country' ||
      o.scope === 'tn_region',
  )
  @IsString()
  @MinLength(1)
  value?: string;
}
