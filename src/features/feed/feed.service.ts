import { Injectable } from '@nestjs/common';
import { NeedPost } from '../need/entities/need-post.entity';
import { NeedService } from '../need/need.service';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FeedService {
  constructor(
    private portfolioService: PortfolioService,
    private needService: NeedService,
  ) {}

  async mergeFeedPosts(portfolios: PortfolioPost[], needs: NeedPost[]) {
    const labelIt = (post: PortfolioPost | NeedPost, type: string) => {
      return {
        type,
        data: post,
      };
    };
    let merged = false;
    const result: ReturnType<typeof labelIt>[] = [];
    while (!merged) {
      if (portfolios.length < 1) {
        for (const need of needs) {
          result.push(labelIt(need, 'need'));
        }
        merged = true;
        break;
      }
      if (needs.length < 1) {
        for (const portfolio of portfolios) {
          result.push(labelIt(portfolio, 'portfolio'));
        }
        merged = true;
        break;
      }
      const nextPortfolio = portfolios.splice(0, 1);
      const nextNeed = needs.splice(0, 1);
      if (nextPortfolio[0].published_at < nextNeed[0].published_at) {
        result.push(labelIt(nextNeed[0], 'need'));
        result.push(labelIt(nextPortfolio[0], 'portfolio'));
      } else {
        result.push(labelIt(nextPortfolio[0], 'portfolio'));
        result.push(labelIt(nextNeed[0], 'need'));
      }
    }
    return result;
  }

  async getFeed(user: User) {
    const portfolios = await this.portfolioService.getPostsForFeed(user);
    const needs = await this.needService.getPostsForFeed(user);
    return this.mergeFeedPosts(portfolios, needs);
  }
}
