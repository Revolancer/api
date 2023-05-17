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
}
