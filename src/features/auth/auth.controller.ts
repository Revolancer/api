import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { TurnstileGuard } from '../turnstile/turnstile.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { PasswordResetDto } from './dto/passwordreset.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Get('refresh')
  async refresh(@Req() req: Request) {
    return this.authService.refresh(req.user);
  }

  @UseGuards(TurnstileGuard)
  @Post('register')
  async register(@Body() body: CreateUserDto) {
    try {
      const user = await this.authService.register(body);
      return this.authService.login({ id: user });
    } catch (err: any) {
      if (err instanceof EmailExistsError) {
        throw new ConflictException('The provided email has already been used');
      }
    }
  }

  @UseGuards(TurnstileGuard)
  @Post('reset_password/request')
  async sendResetPassword(@Body() body: SendResetPasswordDto) {
    await this.authService.sendResetPassword(body);
  }

  @Get('reset_password/validate/:key')
  async validatePasswordResetKey(@Param('key') key: string) {
    await this.authService.validatePasswordResetKey(key);
  }

  @UseGuards(TurnstileGuard)
  @Post('reset_password')
  async resetPassword(@Body() body: PasswordResetDto) {
    await this.authService.resetPassword(body);
  }
}
