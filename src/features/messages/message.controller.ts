import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/sendmessage.dto';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getThreads(@Req() req: IUserRequest) {
    return this.messageService.getMessageThreads(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMessages(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.messageService.getMessagesBetween(req.user.id, id);
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
}
