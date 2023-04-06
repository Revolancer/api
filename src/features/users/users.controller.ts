import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { NoUserError } from 'src/errors/no-user-error';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Onboarding1Dto } from './dto/onboarding1.dto';
import { Onboarding2Dto } from './dto/onboarding2.dto';
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
}
