import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NeedPost } from '../need/entities/need-post.entity';
import { NeedService } from '../need/need.service';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { User } from '../users/entities/user.entity';
import { Cache } from 'cache-manager';

@Injectable()
export class FeedService {
  constructor(
    private portfolioService: PortfolioService,
    private needService: NeedService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
      if (nextPortfolio[0].updated_at < nextNeed[0].updated_at) {
        result.push(labelIt(nextNeed[0], 'need'));
        portfolios = [nextPortfolio[0], ...portfolios];
      } else {
        result.push(labelIt(nextPortfolio[0], 'portfolio'));
        needs = [nextNeed[0], ...needs];
      }
    }
    return result;
  }

  async getFeed(user: User) {
    const cachedFeed = await this.cacheManager.get('discovery-feed');
    if (cachedFeed) {
      return cachedFeed;
    }
    const portfolios = await this.portfolioService.getPostsForFeed(user);
    const needs = await this.needService.getPostsForFeed(user);
    const feed = await this.mergeFeedPosts(portfolios, needs);
    await this.cacheManager.set('discovery-feed', feed, 5 * 60 * 1000);
    return feed;
  }
}
