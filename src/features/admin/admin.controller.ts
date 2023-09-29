import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Post,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AddCreditsDto } from './dto/add-credits.dto';
import { HasRoles } from '../auth/has-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { DeleteUsersDto } from './dto/delete-users.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UpdateNameDto } from './dto/update-name.dto';
import { UpdateTaglineDto } from './dto/update-tagline.dto';
import { UpdateAboutDto } from './dto/update-about.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { UpdateSocialsDto } from './dto/update-socials.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';

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
    @Query('search') search: string,
    @Query('page') page: number,
    @Query('sortBy') sortBy: string,
    @Query('order') order: 'ASC' | 'DESC' | undefined,
  ) {
    return this.adminService.listUsersForAdmin(page, sortBy, order, search);
  }

  @Delete('users')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteUsers(@Body() body: DeleteUsersDto) {
    return this.adminService.deleteUsers(body.usersToDelete);
  }

  @Put('users/role')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async changeRole(@Body() body: ChangeRoleDto) {
    return this.adminService.changeRole(body.usersToChangeRole, body.role);
  }

  @Get('users/withroles')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUsersWithRoles() {
    return this.adminService.listUsersWithRoles();
  }

  @Get('user/roles/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getRolesForUser(@Param('id') id: string) {
    return this.adminService.getRolesForUser(id);
  }

  @Get('users/:id/projects/active')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserActiveProjectsForAdmin(@Param('id') id: string) {
    return this.adminService.getUserActiveProjectsForAdmin(id);
  }

  @Get('users/:id/projects/active/count')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async countActiveProjects(@Param('id') id: string) {
    return this.adminService.countUserActiveProjectsForAdmin(id);
  }

  @Get('user/prefs/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getEmailPrefsForUser(@Param('id') id: string) {
    return this.adminService.getUserEmailPrefs(id);
  }

  @Post('user/credits')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async addOrRemoveCredits(@Body() body: AddCreditsDto) {
    return this.adminService.addCredits(body);
  }

  @Delete('user/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Put('user/edit/name')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserName(@Body() body: UpdateNameDto) {
    await this.adminService.setUserNameByAdmin(
      body.userId,
      body.first_name,
      body.last_name,
    );
  }

  @Put('user/edit/tagline')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserTagline(@Body() body: UpdateTaglineDto) {
    await this.adminService.setUserTaglineByAdmin(body.userId, body.tagline);
  }

  @Put('user/edit/about')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserAbout(@Body() body: UpdateAboutDto) {
    await this.adminService.setUserAboutByAdmin(body.userId, body.about);
  }
  @Put('user/edit/skills')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserSkills(@Body() body: UpdateSkillsDto) {
    await this.adminService.setUserSkillsByAdmin(body.userId, body.skills);
  }

  @Put('user/edit/socials')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserSocials(@Body() body: UpdateSocialsDto) {
    await this.adminService.setUserSocialsByAdmin(body.userId, body.links);
  }

  @Put('user/edit/location')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserLocation(@Body() body: UpdateLocationDto) {
    await this.adminService.setUserLocationByAdmin(body.userId, body.location);
  }

  @Put('user/edit/profile_picture')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserProfileImage(@Body() body: UpdateProfileImageDto) {
    await this.adminService.setUserProfileImageByAdmin(
      body.userId,
      body.profileImage,
    );
  }
}
