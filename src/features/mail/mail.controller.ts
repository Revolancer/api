import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { NoUserError } from 'src/errors/no-user-error';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('request_verification')
  async requestVerificationEmail(@Req() req: IUserRequest) {
    const loaded = await this.usersService.findOne(req.user.id);
    if (loaded == null) {
      throw new NoUserError();
    }
    const resp = await this.mailService.scheduleMail(loaded, 'verify_email');
    return resp;
  }
}
