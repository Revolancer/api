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
import { EmailUpdateDto } from '../users/dto/emailupdate.dto ';
import { ChangeExperienceDto } from '../users/dto/changeexperience.dto';
import { ChangeRateDto } from '../users/dto/changerate.dto';
import { ChangeDateOfBirthDto } from '../users/dto/changedateofbirth.dto';
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

  @Get('users/:id/projects/completed')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserCompletedProjectsForAdmin(@Param('id') id: string) {
    return this.adminService.getUserCompletedProjectsForAdmin(id);
  }

  @Get('users/:id/projects/completed/count')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async countCompletedProjects(@Param('id') id: string) {
    return this.adminService.countUserCompletedProjectsForAdmin(id);
  }

  @Get('users/:uid/projects/:pid')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getProjectForAdmin(
    @Param('uid') uid: string,
    @Param('pid') pid: string,
  ) {
    return this.adminService.getProjectForAdmin(uid, pid);
  }

  @Get('users/:uid/projects/:pid/messages')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getProjectMessagesForAdmin(
    @Param('uid') uid: string,
    @Param('pid') pid: string,
  ) {
    return this.adminService.getProjectMessagesForAdmin(uid, pid);
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

  @Get('user/email/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserEmailAsAdmin(@Param('id') id: string) {
    return this.adminService.getUserEmailAsAdmin(id);
  }

  @Post('user/email/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserEmailAsAdmin(
    @Param('id') id: string,
    @Body() body: EmailUpdateDto,
  ) {
    return this.adminService.setUserEmailAsAdmin(id, body);
  }

  @Get('user/experience/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserExperienceAsAdmin(@Param('id') id: string) {
    return this.adminService.getUserExperienceAsAdmin(id);
  }

  @Post('user/experience/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserExperienceAsAdmin(
    @Param('id') id: string,
    @Body() body: ChangeExperienceDto,
  ) {
    return this.adminService.setUserExperienceAsAdmin(id, body);
  }

  @Put('user/password/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async sendResetPasswordMailByAdmin(@Param('id') id: string) {
    return this.adminService.sendResetPasswordMailByAdmin(id);
  }

  @Get('user/rate/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserRateAsAdmin(@Param('id') id: string) {
    return this.adminService.getUserRateAsAdmin(id);
  }

  @Post('user/rate/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserRateAsAdmin(
    @Param('id') id: string,
    @Body() body: ChangeRateDto,
  ) {
    return this.adminService.setUserRateAsAdmin(id, body);
  }

  @Get('user/dob/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserDOBAsAdmin(@Param('id') id: string) {
    return this.adminService.getUserDOBAsAdmin(id);
  }

  @Post('user/dob/:id')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserDOBAsAdmin(
    @Param('id') id: string,
    @Body() body: ChangeDateOfBirthDto,
  ) {
    return this.adminService.setUserDOBAsAdmin(id, body);
  }
  @Put('user/edit/name')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserName(@Body() body: UpdateNameDto) {
    await this.adminService.setUserNameByAdmin(
      body.userId,
      body.first_name,
      body.last_name,
    );
  }

  @Put('user/edit/tagline')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserTagline(@Body() body: UpdateTaglineDto) {
    await this.adminService.setUserTaglineByAdmin(body.userId, body.tagline);
  }

  @Put('user/edit/about')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserAbout(@Body() body: UpdateAboutDto) {
    await this.adminService.setUserAboutByAdmin(body.userId, body.about);
  }

  @Put('user/edit/skills')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserSkills(@Body() body: UpdateSkillsDto) {
    await this.adminService.setUserSkillsByAdmin(body.userId, body.skills);
  }

  @Put('user/edit/socials')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserSocials(@Body() body: UpdateSocialsDto) {
    await this.adminService.setUserSocialsByAdmin(body.userId, body.links);
  }

  @Put('user/edit/location')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserLocation(@Body() body: UpdateLocationDto) {
    await this.adminService.setUserLocationByAdmin(body.userId, body.location);
  }

  @Put('user/edit/profile_picture')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async setUserProfileImage(@Body() body: UpdateProfileImageDto) {
    await this.adminService.setUserProfileImageByAdmin(
      body.userId,
      body.profileImage,
    );
  }

  @Get('user/:id/needs')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserNeedAsAdmin(@Param('id') id: string) {
    return this.adminService.getUserNeedsAsAdmin(id);
  }

  @Get('user/:id/needs/:nid/proposals')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserProposalsAsAdmin(
    @Param('id') id: string,
    @Param('nid') nid: string,
  ) {
    return this.adminService.getUserProposalsAsAdmin(id, nid);
  }

  @Delete('user/:id/needs/:nid')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteNeedForUserAsAdmin(
    @Param('id') id: string,
    @Param('nid') nid: string,
  ) {
    return this.adminService.deleteNeedForUserAsAdmin(id, nid);
  }

  @Get('user/:id/portfolios')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getUserPortfoliosAsAdmin(@Param('id') id: string) {
    return this.adminService.getUserPortfoliosAsAdmin(id);
  }

  @Delete('user/:id/portfolio/:pid')
  @HasRoles('admin', 'moderator')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteProposalForUserAsAdmin(
    @Param('id') id: string,
    @Param('pid') pid: string,
  ) {
    return this.adminService.deletePortfolioForUserAsAdmin(id, pid);
  }
}
