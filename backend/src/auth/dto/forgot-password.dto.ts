import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsEmail({}, { message: 'email invalide' })
  email: string;
}

