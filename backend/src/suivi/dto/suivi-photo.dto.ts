import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class SuiviPhotoDto {
  @IsMongoId()
  projectId: string;

  @IsMongoId()
  workerId: string;

  @IsString()
  @MinLength(1)
  photoUrl: string;

  @IsOptional()
  @IsString()
  photoBase64?: string;

  @IsOptional()
  uploadedAt?: string | Date;
}
