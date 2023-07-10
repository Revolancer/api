import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { StatsService } from './stats.service';

@Controller('admin/stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('count_users')
  @UseGuards(AdminAuthGuard)
  async getUserCount() {
    return await this.statsService.countUsers();
  }

  @Get('count_active_users')
  @UseGuards(AdminAuthGuard)
  async getActiveUserCount() {
    const dau = await this.statsService.countActiveUsers('daily');
    const wau = await this.statsService.countActiveUsers('weekly');
    const mau = await this.statsService.countActiveUsers('monthly');
    return {
      dau,
      wau,
      mau,
      dauOverMau: (dau / mau).toFixed(3),
      dauOverWau: (dau / wau).toFixed(3),
      wauOverMau: (wau / mau).toFixed(3),
    };
  }

  @Get('count_new_posts')
  @UseGuards(AdminAuthGuard)
  async getNewPostCount() {
    const dailyPortfolios = await this.statsService.countNewContent(
      'daily',
      'portfolio',
    );
    const dailyNeeds = await this.statsService.countNewContent('daily', 'need');
    const dailyProposals = await this.statsService.countNewContent(
      'daily',
      'proposal',
    );
    const dailyProjects = await this.statsService.countNewContent(
      'daily',
      'project',
    );
    const weeklyPortfolios = await this.statsService.countNewContent(
      'weekly',
      'portfolio',
    );
    const weeklyNeeds = await this.statsService.countNewContent(
      'weekly',
      'need',
    );
    const weeklyProposals = await this.statsService.countNewContent(
      'weekly',
      'proposal',
    );
    const weeklyProjects = await this.statsService.countNewContent(
      'weekly',
      'project',
    );
    const monthlyPortfolios = await this.statsService.countNewContent(
      'monthly',
      'portfolio',
    );
    const monthlyNeeds = await this.statsService.countNewContent(
      'monthly',
      'need',
    );
    const monthlyProposals = await this.statsService.countNewContent(
      'monthly',
      'proposal',
    );
    const monthlyProjects = await this.statsService.countNewContent(
      'monthly',
      'project',
    );
    return {
      dailyPortfolios,
      dailyNeeds,
      dailyProposals,
      dailyProjects,
      weeklyPortfolios,
      weeklyNeeds,
      weeklyProposals,
      weeklyProjects,
      monthlyPortfolios,
      monthlyNeeds,
      monthlyProposals,
      monthlyProjects,
    };
  }

  @Get('count_new_users')
  @UseGuards(AdminAuthGuard)
  async getNewUserCount() {
    const daily = await this.statsService.countNewContent('daily', 'user');
    const weekly = await this.statsService.countNewContent('weekly', 'user');
    const monthly = await this.statsService.countNewContent('monthly', 'user');
    return {
      daily,
      weekly,
      monthly,
    };
  }

  @Get('referrers')
  @UseGuards(AdminAuthGuard)
  async getReferrers() {
    return this.statsService.countReferrals();
  }
}
