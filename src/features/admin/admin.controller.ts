import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { AddCreditsDto } from './dto/add-credits.dto';
import { IUserRequest } from 'src/interface/iuserrequest';
import { ImportUsersDto } from './dto/import-users.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats/count_users')
  @UseGuards(AdminAuthGuard)
  async getUserCount() {
    return await this.adminService.countUsers();
  }

  @Get('stats/count_active_users')
  @UseGuards(AdminAuthGuard)
  async getActiveUserCount() {
    const dau = await this.adminService.countDau();
    const wau = await this.adminService.countWau();
    const mau = await this.adminService.countMau();
    return {
      dau,
      wau,
      mau,
      dauOverMau: (dau / mau).toFixed(3),
      dauOverWau: (dau / wau).toFixed(3),
      wauOverMau: (wau / mau).toFixed(3),
    };
  }

  @Get('stats/count_new_posts')
  @UseGuards(AdminAuthGuard)
  async getNewPostCount() {
    const dailyPortfolios = await this.adminService.countDailyPortfolios();
    const dailyNeeds = await this.adminService.countDailyNeeds();
    const dailyProposals = await this.adminService.countDailyProposals();
    const weeklyPortfolios = await this.adminService.countWeeklyPortfolios();
    const weeklyNeeds = await this.adminService.countWeeklyNeeds();
    const weeklyProposals = await this.adminService.countWeeklyProposals();
    const monthlyPortfolios = await this.adminService.countMonthlyPortfolios();
    const monthlyNeeds = await this.adminService.countMonthlyNeeds();
    const monthlyProposals = await this.adminService.countMonthlyProposals();
    return {
      dailyPortfolios,
      dailyNeeds,
      dailyProposals,
      weeklyPortfolios,
      weeklyNeeds,
      weeklyProposals,
      monthlyPortfolios,
      monthlyNeeds,
      monthlyProposals,
    };
  }

  @Get('stats/count_new_users')
  @UseGuards(AdminAuthGuard)
  async getNewUserCount() {
    const daily = await this.adminService.countDailyNewUsers();
    const weekly = await this.adminService.countWeeklyNewUsers();
    const monthly = await this.adminService.countMonthlyNewUsers();
    return {
      daily,
      weekly,
      monthly,
    };
  }

  @Get('stats/referrers')
  @UseGuards(AdminAuthGuard)
  async getReferrers() {
    return this.adminService.countReferrals();
  }

  @Get('users')
  @UseGuards(AdminAuthGuard)
  async getAllUsers() {
    return this.adminService.listAllUsers();
  }

  @Post('user/credits')
  @UseGuards(AdminAuthGuard)
  async addOrRemoveCredits(@Body() body: AddCreditsDto) {
    return this.adminService.addCredits(body);
  }

  @Post('user/import')
  @UseGuards(AdminAuthGuard)
  async importUsers(@Req() req: IUserRequest, @Body() body: ImportUsersDto) {
    return this.adminService.importUsers(req.user, body);
  }
}
