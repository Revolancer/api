import {
  Body,
  ConflictException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() body: CreateUserDto) {
    try {
      const user = await this.authService.register(body);
      return this.authService.login(user);
    } catch (err: any) {
      if (err instanceof EmailExistsError) {
        throw new ConflictException('The provided email has already been used');
      }
    }
  }
}
