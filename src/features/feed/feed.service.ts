import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NeedPost } from '../need/entities/need-post.entity';
import { NeedService } from '../need/need.service';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { User } from '../users/entities/user.entity';
import { Cache } from 'cache-manager';
import { SearchService } from '../search/search.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfile } from '../users/entities/userprofile.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FeedService {
  constructor(
    private portfolioService: PortfolioService,
    private needService: NeedService,
    private searchService: SearchService,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
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
    page: number | undefined,
    sortBy: 'relevance' | 'created' | undefined,
    dataType: ('need' | 'portfolio')[] | undefined,
  ) {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: user.id } },
    });

    // get tags user has used in skills
    if (!(profile instanceof UserProfile)) {
      throw new NotFoundException();
    }

    let tags = [];
    for (const skill of profile.skills) {
      tags.push(skill.id);
      tags.push(skill.parent.id);
    }

    // sort tags ids
    tags = tags.sort();

    // deduplicate the tags
    const ts = new Set<string>(tags);

    type SearchResult = {
      otherId: string;
      contentType: 'need' | 'portfolio';
    };

    let [searchResults, count] = (await this.searchService.search(
      dataType,
      sortBy,
      'ASC',
      '',
      [...ts],
      page,
    )) as [SearchResult[], number];

    // if search result is empty return result of search without specifying tags or term.
    if (count < 1000 && searchResults.length == 0) {
      [searchResults, count] = (await this.searchService.search(
        dataType,
        sortBy,
        'ASC',
        '',
        [],
        page,
      )) as [SearchResult[], number];
    }

    return searchResults;
  }
}
