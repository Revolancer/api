import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { TurnstileGuard } from '../turnstile/turnstile.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

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

  @UseGuards(JwtRefreshAuthGuard)
  @Get('refresh_token_check')
  async refreshTokenCheck(@Req() req: Request) {
    return 'aight';
  }

  @UseGuards(JwtAuthGuard)
  @Get('token_check')
  async tokenCheck(@Req() req: Request) {
    return 'aight';
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

  @UseGuards(ThrottlerGuard)
  @Throttle(1, 60)
  @Post('request_reset_password')
  async sendResetPassword(@Body() body: SendResetPasswordDto) {
    await this.authService.sendResetPassword(body);
  }
}
