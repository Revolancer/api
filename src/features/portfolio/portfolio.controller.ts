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
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/createpost.dto';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @UseGuards(JwtAuthGuard)
  @Put()
  async createPost(@Req() req: IUserRequest, @Body() body: CreatePostDto) {
    return this.portfolioService.createPost(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id')
  async updatePost(
    @Req() req: IUserRequest,
    @Param('id') id: string,
    @Body() body: CreatePostDto,
  ) {
    return this.portfolioService.updatePost(req.user, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Req() req: IUserRequest, @Param('id') id: string) {
    return this.portfolioService.deletePost(req.user, id);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.portfolioService.getPost(id);
  }

  @Get('for_user/:uid')
  async getPostsForUser(@Param('uid') uid: string) {
    return this.portfolioService.getPostsForUser(uid);
  }
}
