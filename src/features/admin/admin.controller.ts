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
    const dailyPortfolios = this.adminService.countDailyPortfolios();
    const dailyNeeds = this.adminService.countDailyNeeds();
    const dailyProposals = this.adminService.countDailyProposals();
    const weeklyPortfolios = this.adminService.countWeeklyPortfolios();
    const weeklyNeeds = this.adminService.countWeeklyNeeds();
    const weeklyProposals = this.adminService.countWeeklyProposals();
    const monthlyPortfolios = this.adminService.countMonthlyPortfolios();
    const monthlyNeeds = this.adminService.countMonthlyNeeds();
    const monthlyProposals = this.adminService.countMonthlyProposals();
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
