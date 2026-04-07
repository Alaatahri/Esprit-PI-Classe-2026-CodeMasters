import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: '6 caractères minimum' })
  newPassword: string;

  @IsString()
  @MinLength(6, { message: '6 caractères minimum' })
  confirmPassword: string;
}

