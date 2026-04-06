import { IsIn, IsOptional } from 'class-validator';

/** Corps multipart (champ texte) pour upload photos expert */
export class AlbumBodyDto {
  @IsOptional()
  @IsIn(['avant', 'apres'])
  album?: 'avant' | 'apres';
}
