import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { IUserRequest } from 'src/interface/iuserrequest';

@Controller('credits')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserBalance(@Req() req: IUserRequest) {
    return this.creditsService.getUserCredits(req.user);
  }

  @Get('log')
  @UseGuards(JwtAuthGuard)
  async getUserCreditLog(@Req() req: IUserRequest) {
    return this.creditsService.getUserCreditLog(req.user);
  }

  @Get('log/reverse')
  @UseGuards(JwtAuthGuard)
  async getUserCreditLogReverse(@Req() req: IUserRequest) {
    return this.creditsService.getUserCreditLogReverse(req.user);
  }
}
