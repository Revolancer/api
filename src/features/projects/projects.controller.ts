import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { IUserRequest } from 'src/interface/iuserrequest';
import { NewProjectDto } from './dto/newproject.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  async startProject(@Req() req: IUserRequest, @Body() body: NewProjectDto) {
    this.projectsService.createProject(req.user, body);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getProject(@Req() req: IUserRequest, @Param('id') id: string) {
    this.projectsService.getProject(req.user, id);
  }
}
