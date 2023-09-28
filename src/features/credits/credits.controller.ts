import { Controller, Get, Req, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HasRoles } from '../auth/has-roles.decorator';
import { RoleGuard } from '../auth/guards/role.guard';
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

  /**Admin Page Wallet Routes */
  @Get('admin/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserCreditsForAdmin(@Param('id') id: string) {
    return this.creditsService.getUserCreditsForAdmin(id);
  }

  @Get('admin/:id/log')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserCreditLogForAdmin(@Param('id') id: string) {
    return this.creditsService.getUserCreditLogForAdmin(id);
  }

  @Get('admin/:id/log/reverse')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserCreditLogReverseForAdmin(@Param('id') id: string) {
    return this.creditsService.getUserCreditLogReverseForAdmin(id);
  }
}
