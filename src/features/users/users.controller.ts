import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NoUserError } from 'src/errors/no-user-error';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AboutUpdateDto } from './dto/aboutupdate.dto.ts';
import { Onboarding1Dto } from './dto/onboarding1.dto';
import { Onboarding2Dto } from './dto/onboarding2.dto';
import { Onboarding3Dto } from './dto/onboarding3.dto';
import { ProfileImageUpdateDto } from './dto/profileimageupdate.dto';
import { SkillsUpdateDto } from './dto/skillsupdate.dto';
import { TaglineUpdateDto } from './dto/taglineupdate.dto';
import { TimezoneUpdateDto } from './dto/timezoneupdate.dto';
import { UsernameCheckDto } from './dto/usernamecheck.dto';
import { UsersService } from './users.service';

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

  @Get('about/:id')
  async getUserAbout(@Param('id') id: string) {
    return this.usersService.getUserAbout(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('about')
  async setUserAbout(@Req() req: IUserRequest, @Body() body: AboutUpdateDto) {
    return this.usersService.setUserAbout(req.user, body);
  }
}
