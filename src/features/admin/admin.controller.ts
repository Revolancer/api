import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';

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
}