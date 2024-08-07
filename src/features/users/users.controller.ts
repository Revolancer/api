import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NoUserError } from 'src/errors/no-user-error';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AboutUpdateDto } from './dto/aboutupdate.dto';
import { Onboarding1Dto } from './dto/onboarding1.dto';
import { Onboarding2Dto } from './dto/onboarding2.dto';
import { Onboarding3Dto } from './dto/onboarding3.dto';
import { ProfileImageUpdateDto } from './dto/profileimageupdate.dto';
import { SkillsUpdateDto } from './dto/skillsupdate.dto';
import { TaglineUpdateDto } from './dto/taglineupdate.dto';
import { TimezoneUpdateDto } from './dto/timezoneupdate.dto';
import { UsernameCheckDto } from './dto/usernamecheck.dto';
import { UsersService } from './users.service';
import { EmailUpdateDto } from './dto/emailupdate.dto ';
import { PasswordUpdateDto } from './dto/passwordupdate.dto';
import { ChangeRateDto } from './dto/changerate.dto';
import { ChangeExperienceDto } from './dto/changeexperience.dto';
import { ChangeEmailPrefsDto } from './dto/changeemailprefs.dto';
import { DeleteAccountDto } from './dto/deleteaccount.dto';
import { LocationUpdateDto } from './dto/locationupdate.dto';
import { SocialsUpdateDto } from './dto/socialsupdate.dto';
import { NameUpdateDto } from './dto/nameupdate.dto';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('onboarding/1')
  async saveOnboardingStage1(
    @Req() req: IUserRequest,
    @Body() body: Onboarding1Dto,
  ) {
    const loaded = await this.usersService.findOne(req.user.id);
    if (loaded == null) {
      throw new NoUserError();
    }
    return this.usersService.doOnboardingStage1(loaded, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboarding/2')
  async saveOnboardingStage2(
    @Req() req: IUserRequest,
    @Body() body: Onboarding2Dto,
  ) {
    const loaded = await this.usersService.findOne(req.user.id);
    if (loaded == null) {
      throw new NoUserError();
    }
    return this.usersService.doOnboardingStage2(loaded, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboarding/3')
  async saveOnboardingStage3(
    @Req() req: IUserRequest,
    @Body() body: Onboarding3Dto,
  ) {
    const loaded = await this.usersService.findOne(req.user.id);
    if (loaded == null) {
      throw new NoUserError();
    }
    return this.usersService.doOnboardingStage3(loaded, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('username_available')
  async checkUsernameAvailability(
    @Req() req: IUserRequest,
    @Body() body: UsernameCheckDto,
  ) {
    const loaded = await this.usersService.findOne(req.user.id);
    if (loaded == null) {
      throw new NoUserError();
    }
    return await this.usersService.checkUsernameAvailability(
      loaded,
      body.userName,
    );
  }

  @Get('profile/by_id/:id')
  async getUserProfileDataById(@Param('id') id: string) {
    return this.usersService.getUserProfileData(id);
  }

  @Get('profile/:slug')
  async getUserProfileData(@Param('slug') slug: string) {
    return this.usersService.getUserProfileDataBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getOwnUserProfileData(@Req() req: IUserRequest) {
    return this.usersService.getUserProfileData(req.user.id);
  }

  @Get('skills/:id')
  async getUserSkills(@Param('id') id: string) {
    return this.usersService.getUserSkills(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('skills')
  async setUserSkills(@Req() req: IUserRequest, @Body() body: SkillsUpdateDto) {
    return this.usersService.setUserSkills(req.user, body);
  }

  @Get('profile_picture/:id')
  async getUserProfileImage(@Param('id') id: string) {
    return this.usersService.getUserProfileImage(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile_picture')
  async setUserProfileImage(
    @Req() req: IUserRequest,
    @Body() body: ProfileImageUpdateDto,
  ) {
    return this.usersService.setUserProfileImage(req.user, body);
  }

  @Get('timezone/:id')
  async getUserTimezone(@Param('id') id: string) {
    return this.usersService.getUserTimezone(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('timezone')
  async setUserTimezone(
    @Req() req: IUserRequest,
    @Body() body: TimezoneUpdateDto,
  ) {
    return this.usersService.setUserTimezone(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('location')
  async setUserLocation(
    @Req() req: IUserRequest,
    @Body() body: LocationUpdateDto,
  ) {
    return this.usersService.setUserLocation(req.user, body);
  }

  @Get('tagline/:id')
  async getUserTagline(@Param('id') id: string) {
    return this.usersService.getUserTagline(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tagline')
  async setUserTagline(
    @Req() req: IUserRequest,
    @Body() body: TaglineUpdateDto,
  ) {
    return this.usersService.setUserTagline(req.user, body);
  }

  @Get('name/:id')
  async getUserName(@Param('id') id: string) {
    return this.usersService.getUserName(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('name')
  async setUserName(@Req() req: IUserRequest, @Body() body: NameUpdateDto) {
    return this.usersService.setUserName(req.user, body);
  }

  @Get('about/:id')
  async getUserAbout(@Param('id') id: string) {
    return this.usersService.getUserAbout(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('about')
  async setUserAbout(@Req() req: IUserRequest, @Body() body: AboutUpdateDto) {
    return this.usersService.setUserAbout(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email')
  async setUserEmail(@Req() req: IUserRequest, @Body() body: EmailUpdateDto) {
    return this.usersService.setUserEmail(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('email')
  async getUserEmail(@Req() req: IUserRequest) {
    return this.usersService.getUserEmail(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password')
  async setUserPassword(
    @Req() req: IUserRequest,
    @Body() body: PasswordUpdateDto,
  ) {
    return this.usersService.setUserPassword(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('rate')
  async getUserRate(@Req() req: IUserRequest) {
    return this.usersService.getUserRate(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rate')
  async setUserRate(@Req() req: IUserRequest, @Body() body: ChangeRateDto) {
    return this.usersService.setUserRate(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('experience')
  async getUserExperience(@Req() req: IUserRequest) {
    return this.usersService.getUserExperience(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('experience')
  async setUserExperience(
    @Req() req: IUserRequest,
    @Body() body: ChangeExperienceDto,
  ) {
    return this.usersService.setUserExperience(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('email_prefs')
  async getUserEmailPrefs(@Req() req: IUserRequest) {
    return this.usersService.getUserEmailPrefs(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email_prefs')
  async setUserEmailPrefs(
    @Req() req: IUserRequest,
    @Body() body: ChangeEmailPrefsDto,
  ) {
    return this.usersService.setUserEmailPrefs(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete')
  async deleteUser(@Req() req: IUserRequest, @Body() body: DeleteAccountDto) {
    return this.usersService.deleteAccount(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('checklist_complete')
  async checklistComplete(@Req() req: IUserRequest) {
    return this.usersService.markChecklistComplete(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('checklist_complete')
  async isChecklistComplete(@Req() req: IUserRequest) {
    return this.usersService.isChecklistComplete(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('socials')
  async updateSocials(
    @Req() req: IUserRequest,
    @Body() body: SocialsUpdateDto,
  ) {
    return this.usersService.updateSocialLinks(req.user, body.links);
  }

  @Get('socials/:id')
  async getSocials(@Param('id') id: string) {
    return this.usersService.getSocialLinks(id);
  }
}
