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
import { CreatePostDto } from './dto/createneed.dto';
import { NeedService } from './need.service';
import { CreateProposalDto } from './dto/createproposal.dto';

@Controller('need')
export class NeedController {
  constructor(private needService: NeedService) {}

  @UseGuards(JwtAuthGuard)
  @Put()
  async createPost(@Req() req: IUserRequest, @Body() body: CreatePostDto) {
    return this.needService.createPost(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id')
  async updatePost(
    @Req() req: IUserRequest,
    @Param('id') id: string,
    @Body() body: CreatePostDto,
  ) {
    return this.needService.updatePost(req.user, id, body);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.needService.getPost(id);
  }

  @Get('for_user/:uid')
  async getPostsForUser(@Param('uid') uid: string) {
    return this.needService.getPostsForUser(uid);
  }

  @UseGuards(JwtAuthGuard)
  @Put('proposal/:id')
  async createProposal(
    @Req() req: IUserRequest,
    @Param('id') id: string,
    @Body() body: CreateProposalDto,
  ) {
    return this.needService.createProposal(req.user, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('proposals/:id')
  async getProposals(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.needService.getProposals(req.user, id);
  }
}
