import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { AddCreditsDto } from './dto/add-credits.dto';
import { IUserRequest } from 'src/interface/iuserrequest';
import { ImportUsersDto } from './dto/import-users.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

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

  @Delete('user/:id')
  @UseGuards(AdminAuthGuard)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
