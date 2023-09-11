import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AddCreditsDto } from './dto/add-credits.dto';
import { IUserRequest } from 'src/interface/iuserrequest';
import { ImportUsersDto } from './dto/import-users.dto';
import { HasRoles } from '../auth/has-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users/all')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getAllUsers() {
    return this.adminService.listAllUsers();
  }

  @Get('users')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUsersForAdmin(
    @Query('page') page: number,
    @Query('sortBy') sortBy: string,
    @Query('order') order: string,
  ) {
    return this.adminService.listUsersForAdmin(page, sortBy, order);
  }

  @Post('user/credits')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async addOrRemoveCredits(@Body() body: AddCreditsDto) {
    return this.adminService.addCredits(body);
  }

  @Post('user/import')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async importUsers(@Req() req: IUserRequest, @Body() body: ImportUsersDto) {
    return this.adminService.importUsers(req.user, body);
  }

  @Delete('user/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
