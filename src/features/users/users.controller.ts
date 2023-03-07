import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { NoUserError } from 'src/errors/no-user-error';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Onboarding1Dto } from './dto/onboarding1.dto';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('onboarding/1')
  async requestVerificationEmail(
    @Req() req: IUserRequest,
    @Body() body: Onboarding1Dto,
  ) {
    const loaded = await this.usersService.findOne(req.user.id);
    if (loaded == null) {
      throw new NoUserError();
    }
    return this.usersService.doOnboardingStage1(loaded, body);
  }
}
