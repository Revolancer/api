import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { HasRoles } from '../auth/has-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('admin/stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('count_users')
  @HasRoles('admin', 'moderator', 'stats_viewer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserCount() {
    const count = await this.statsService.countUsers();
    const deleted = await this.statsService.countDeletedUsers();
    const allTime = await this.statsService.countUsersAllTime();

    return {
      count,
      deleted,
      allTime,
    };
  }

  @Get('count_active_users')
  @HasRoles('admin', 'moderator', 'stats_viewer')
  @UseGuards(JwtAuthGuard, RoleGuard)
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
  @HasRoles('admin', 'moderator', 'stats_viewer')
  @UseGuards(JwtAuthGuard, RoleGuard)
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
  @HasRoles('admin', 'moderator', 'stats_viewer')
  @UseGuards(JwtAuthGuard, RoleGuard)
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
  @HasRoles('admin', 'moderator', 'stats_viewer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getReferrers() {
    return this.statsService.countReferrals();
  }

  @Get('profile_top_skills')
  @HasRoles('admin', 'moderator', 'stats_viewer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getTopProfileSkills() {
    return this.statsService.getTopUserProfileTags();
  }
}
