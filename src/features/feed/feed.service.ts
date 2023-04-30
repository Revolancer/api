import { Injectable } from '@nestjs/common';
import { PortfolioService } from '../portfolio/portfolio.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FeedService {
  constructor(private portfolioService: PortfolioService) {}

  async getFeed(user: User) {
    return this.portfolioService.getPostsForFeed(user);
  }
}
