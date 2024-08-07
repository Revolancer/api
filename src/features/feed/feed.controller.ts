import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Get('/v2')
  async getNewFeed(
    @Req() req: IUserRequest,
    @Query('page') page: number | undefined,
    @Query('sort') sortBy: 'created' | 'relevance' | undefined,
    @Query('order') order: 'ASC' | 'DESC' | undefined,
    @Query('datatype') dataType: ('need' | 'portfolio')[] | undefined,
  ) {
    return this.feedService.getNewFeed(req.user, page, sortBy, order, dataType);
  }
}
