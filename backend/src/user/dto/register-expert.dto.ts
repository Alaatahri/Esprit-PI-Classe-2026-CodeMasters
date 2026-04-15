import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const NIVEAUX = ['bac_plus_3', 'bac_plus_5', 'doctorat', 'autre'] as const;

export class RegisterExpertDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail(
    { allow_utf8_local_part: false },
    { message: 'Adresse e-mail invalide.' },
  )
  email: string;

  @IsString()
  @MinLength(6)
  mot_de_passe: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  telephone?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'Domaine d’expertise trop court.' })
  domaine_expertise: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  experience_annees: number;

  @IsIn([...NIVEAUX], {
    message: 'Niveau d’études invalide (Bac+3, Bac+5, Doctorat, Autre).',
  })
  niveau_etudes: (typeof NIVEAUX)[number];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  linkedin_url?: string;
}
