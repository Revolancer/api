import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IUserRequest } from 'src/interface/iuserrequest';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getNotifications(@Req() req: IUserRequest) {
    return this.notificationsService.getNotifications(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('acknowledge/:id')
  async markNotificationRead(
    @Req() req: IUserRequest,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markNotificationAsRead(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('count/unread')
  async countUnreadNotifications(@Req() req: IUserRequest) {
    return this.notificationsService.countUnreadNotifications(req.user);
  }
}
