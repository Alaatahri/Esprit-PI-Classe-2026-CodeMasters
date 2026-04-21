import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WorkZoneDto } from './work-zone.dto';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  prenom?: string;

  @IsString()
  @MinLength(1)
  nom: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail(
    { allow_utf8_local_part: false },
    { message: 'Adresse e-mail invalide (vérifiez le format, ex. nom@domaine.com).' },
  )
  email: string;

  @IsString()
  @MinLength(6)
  mot_de_passe: string;

  @IsIn(['client', 'expert', 'artisan', 'manufacturer', 'admin'])
  role: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competences?: string[];

  @IsOptional()
  @IsString()
  telephone?: string;

  @ValidateIf((o: CreateUserDto) => o.role === 'artisan')
  @IsString()
  @MinLength(1)
  specialite?: string;

  @ValidateIf((o: CreateUserDto) => o.role === 'artisan')
  @IsInt()
  @Min(0)
  @Type(() => Number)
  experience_annees?: number;

  @ValidateIf((o: CreateUserDto) => o.role === 'artisan')
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkZoneDto)
  zones_travail?: WorkZoneDto[];

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
