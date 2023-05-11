import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { IUserRequest } from 'src/interface/iuserrequest';
import { NewProjectDto } from './dto/newproject.dto';
import { SendProjectMessageDto } from './dto/sendprojectmessage.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  async startProject(@Req() req: IUserRequest, @Body() body: NewProjectDto) {
    return this.projectsService.createProject(req.user, body);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveProjects(@Req() req: IUserRequest) {
    return this.projectsService.getActiveProjects(req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getProject(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.projectsService.getProject(req.user, id);
  }

  @Put('approval/:id')
  @UseGuards(JwtAuthGuard)
  async markProjectApproved(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.projectsService.markProjectApproved(req.user, id);
  }

  @Delete('approval/:id')
  @UseGuards(JwtAuthGuard)
  async markProjectNotApproved(
    @Req() req: IUserRequest,
    @Param('id') id: string,
  ) {
    return this.projectsService.markProjectNotApproved(req.user, id);
  }

  @Get('active/count')
  @UseGuards(JwtAuthGuard)
  async countActiveProjects(@Req() req: IUserRequest) {
    return this.projectsService.countActiveProjects(req.user);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  async getProjectMessages(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.projectsService.getProjectMessages(req.user, id);
  }

  @Put(':id/messages')
  @UseGuards(JwtAuthGuard)
  async sendProjectMessage(
    @Req() req: IUserRequest,
    @Param('id') id: string,
    @Body() body: SendProjectMessageDto,
  ) {
    return this.projectsService.sendProjectMessage(req.user, id, body);
  }

  @Get(':id/messages/count/unread')
  @UseGuards(JwtAuthGuard)
  async countProjectUnreadMessages(
    @Req() req: IUserRequest,
    @Param('id') id: string,
  ) {
    return this.projectsService.countProjectUnreadMessages(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('message/acknowledge/:id')
  async acknowledgeMessage(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.projectsService.markMessageAsRead(req.user, id);
  }
}
