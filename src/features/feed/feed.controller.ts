import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { IUserRequest } from 'src/interface/iuserrequest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getFeed(@Req() req: IUserRequest) {
    return this.feedService.getFeed(req.user);
  }
}
