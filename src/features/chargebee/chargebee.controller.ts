import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChargebeeService } from './chargebee.service';

@Controller('chargebee')
export class ChargebeeController {
  constructor(private chargebeeService: ChargebeeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('portal_session')
  async createPortalSession(@Req() req: IUserRequest) {
    return this.chargebeeService.createPortalSession(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('checkout_session')
  async createCheckoutSession(@Req() req: IUserRequest) {
    return this.chargebeeService.createCheckoutPage(req.user);
  }
}
