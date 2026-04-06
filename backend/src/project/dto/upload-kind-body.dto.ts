import { IsIn, IsOptional } from 'class-validator';

export class UploadKindBodyDto {
  @IsOptional()
  @IsIn(['attachment', 'site_photo'])
  kind?: 'attachment' | 'site_photo';
}
