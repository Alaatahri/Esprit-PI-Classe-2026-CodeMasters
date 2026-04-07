import { Controller, Get, Query, BadRequestException, Post, Body } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const t = typeof token === 'string' ? token.trim() : '';
    if (!t) {
      throw new BadRequestException('Token manquant');
    }
    return this.userService.verifyEmailByToken(t);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.userService.forgotPassword(body?.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.userService.resetPassword({
      token: body?.token,
      newPassword: body?.newPassword,
      confirmPassword: body?.confirmPassword,
    });
  }
}
