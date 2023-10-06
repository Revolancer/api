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
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/sendmessage.dto';
import { MessageService } from './message.service';
import { RoleGuard } from '../auth/guards/role.guard';
import { HasRoles } from '../auth/has-roles.decorator';

@Controller('message')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getThreads(@Req() req: IUserRequest) {
    return this.messageService.getMessageThreads(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get('admin/:id')
  @HasRoles('admin', 'moderator')
  async getUserMessageThreadsForAdmin(@Param('id') id: string) {
    return this.messageService.getUserMessageThreadsForAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread')
  async getUnreadMessageCount(@Req() req: IUserRequest) {
    return await this.messageService.getUnreadCount(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('count_all')
  async getAllMessageCount(@Req() req: IUserRequest) {
    return await this.messageService.getAllMessageCount(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMessages(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.messageService.getMessagesBetween(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/admin/:id1/messages/:id2')
  async getAdminMessagesBetween(
    @Param('id1') id1: string,
    @Param('id2') id2: string,
  ) {
    return this.messageService.getMessagesBetween(id1, id2);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async sendMessage(
    @Req() req: IUserRequest,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.messageService.sendMessage(req.user, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('acknowledge/:id')
  async acknowledgeMessage(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.messageService.markMessageAsRead(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('acknowledge')
  async acknowledgeAllMessages(@Req() req: IUserRequest) {
    return this.messageService.markAllMessagesAsRead(req.user);
  }
}
