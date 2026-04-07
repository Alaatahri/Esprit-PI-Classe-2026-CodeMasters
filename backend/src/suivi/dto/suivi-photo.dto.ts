import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  /** Commentaire terrain (Next.js / back-office) — évite 400 avec forbidNonWhitelisted */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  uploadedAt?: string | Date;
}
