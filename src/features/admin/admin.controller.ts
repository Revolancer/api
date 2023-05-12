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
}
