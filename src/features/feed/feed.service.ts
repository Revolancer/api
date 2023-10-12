import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NeedPost } from '../need/entities/need-post.entity';
import { NeedService } from '../need/need.service';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { User } from '../users/entities/user.entity';
import { Cache } from 'cache-manager';
import { SearchService } from '../search/search.service';

@Injectable()
export class FeedService {
  constructor(
    private portfolioService: PortfolioService,
    private needService: NeedService,
    private searchService: SearchService,
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

  async getNewFeed(
    user: User,
    tag: string[] | undefined,
    page: number | undefined,
    sortBy: 'relevance' | 'created' | undefined,
    dataType: ('need' | 'portfolio')[] | undefined,
  ) {
    const cachedFeed = await this.cacheManager.get('discovery-feed-search6');
    if (cachedFeed && Array.isArray(cachedFeed)) {
      console.log(cachedFeed);
      return cachedFeed;
    }
    type SearchResult = { otherId: string; contentType: 'need' | 'portfolio' };
    const portfolios: PortfolioPost[] = [];
    const needs: NeedPost[] = [];

    const [searchResults, count] = (await this.searchService.search(
      dataType,
      sortBy,
      'ASC',
      '',
      tag,
      page,
    )) as [SearchResult[], number];
    console.log(count);
    for (const item of searchResults) {
      if (item.contentType == 'portfolio') {
        const post = await this.portfolioService.getPost(item.otherId);
        if (post) portfolios.push(post);
      } else if (item.contentType == 'need') {
        const post = await this.needService.getPost(item.otherId);
        if (post) needs.push(post);
      }
    }
    const feed = await this.mergeFeedPosts(portfolios, needs);
    await this.cacheManager.set('discovery-feed-search6', feed, 5 * 60 * 1000);
    return feed;
  }
}
