import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/userprofile.entity';
import { DateTime } from 'luxon';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { NeedPost } from '../need/entities/need-post.entity';
import { Proposal } from '../need/entities/proposal.entity';
import { UserReferrer } from '../users/entities/userreferrer.entity';
import { AdminService } from './admin.service';
import { Cron } from '@nestjs/schedule';
import { Project } from '../projects/entities/project.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { StatsLog } from './entities/stats-log.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  constructor(
    private adminService: AdminService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(PortfolioPost)
    private portfolioRespository: Repository<PortfolioPost>,
    @InjectRepository(NeedPost)
    private needRespository: Repository<NeedPost>,
    @InjectRepository(Proposal)
    private proposalRespository: Repository<Proposal>,
    @InjectRepository(Project)
    private projectRespository: Repository<Project>,
    @InjectRepository(UserReferrer)
    private referrerRepository: Repository<UserReferrer>,
    @InjectRepository(StatsLog)
    private statsRepository: Repository<StatsLog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async countUsers(): Promise<number> {
    const cachedCount = await this.cacheManager.get('stats-totalusers');
    if (cachedCount) {
      return <number>cachedCount;
    }
    const count = await this.userRepository.count();
    await this.cacheManager.set('stats-totalusers', count, 5 * 60 * 1000);
    return count;
  }

  async countActiveUsers(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<number> {
    const cachedCount = await this.cacheManager.get(
      `stats-activeusers-${period}`,
    );
    if (cachedCount) {
      return <number>cachedCount;
    }
    let timeFrom;
    if (period == 'daily') {
      timeFrom = DateTime.now().minus({ day: 1 }).toJSDate();
    } else if (period == 'weekly') {
      timeFrom = DateTime.now().minus({ day: 7 }).toJSDate();
    } else {
      timeFrom = DateTime.now().minus({ day: 28 }).toJSDate();
    }
    const result = await this.userProfileRepository.count({
      where: { last_active: MoreThanOrEqual(timeFrom) },
    });
    await this.cacheManager.set(
      `stats-activeusers-${period}`,
      result,
      5 * 60 * 1000,
    );
    return result;
  }

  async countNewContent(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    content:
      | 'portfolio'
      | 'need'
      | 'proposal'
      | 'project'
      | 'user' = 'portfolio',
  ): Promise<number> {
    const cachedCount = await this.cacheManager.get(
      `stats-newcontent-${period}-${content}`,
    );
    if (cachedCount) {
      return <number>cachedCount;
    }
    let timeFrom;
    if (period == 'daily') {
      timeFrom = DateTime.now().minus({ day: 1 }).toJSDate();
    } else if (period == 'weekly') {
      timeFrom = DateTime.now().minus({ day: 7 }).toJSDate();
    } else {
      timeFrom = DateTime.now().minus({ day: 28 }).toJSDate();
    }
    let contentRepo;
    if (content == 'portfolio') {
      contentRepo = this.portfolioRespository;
    } else if (content == 'need') {
      contentRepo = this.needRespository;
    } else if (content == 'proposal') {
      contentRepo = this.proposalRespository;
    } else if (content == 'user') {
      contentRepo = this.userRepository;
    } else {
      contentRepo = this.projectRespository;
    }
    const result = await contentRepo.count({
      where: { created_at: MoreThanOrEqual(timeFrom) },
    });
    await this.cacheManager.set(
      `stats-newcontent-${period}-${content}`,
      result,
      5 * 60 * 1000,
    );
    return result;
  }

  async countReferrals() {
    const cachedReferrals = await this.cacheManager.get('stats-referrals');
    if (cachedReferrals) {
      return cachedReferrals;
    }
    const qb = this.referrerRepository.createQueryBuilder('user_referrer');
    const result = await qb
      .select('user_referrer.referrer as referrer')
      .addSelect('COUNT(*) as count')
      .groupBy('user_referrer.referrer')
      .getRawMany();
    await this.cacheManager.set('stats-referrals', result, 20 * 60 * 1000);
    return result;
  }

  /**
   * Capture spot statistics
   */
  @Cron('0 0 0 * * *')
  async captureSpotStats() {
    //Gather stats
    const dailyActiveUsers = await this.countActiveUsers('daily');
    const weeklyActiveUsers = await this.countActiveUsers('weekly');
    const monthlyActiveUsers = await this.countActiveUsers('monthly');
    const dailyNewUsers = await this.countNewContent('daily', 'user');
    const weeklyNewUsers = await this.countNewContent('weekly', 'user');
    const monthlyNewUsers = await this.countNewContent('monthly', 'user');
    const dailyNewPortfolios = await this.countNewContent('daily', 'portfolio');
    const weeklyNewPortfolios = await this.countNewContent(
      'weekly',
      'portfolio',
    );
    const monthlyNewPortfolios = await this.countNewContent(
      'monthly',
      'portfolio',
    );
    const dailyNewProjects = await this.countNewContent('daily', 'project');
    const weeklyNewProjects = await this.countNewContent('weekly', 'project');
    const monthlyNewProjects = await this.countNewContent('monthly', 'project');
    const dailyNewNeeds = await this.countNewContent('daily', 'need');
    const weeklyNewNeeds = await this.countNewContent('weekly', 'need');
    const monthlyNewNeeds = await this.countNewContent('monthly', 'need');
    const dailyNewProposals = await this.countNewContent('daily', 'proposal');
    const weeklyNewProposals = await this.countNewContent('weekly', 'proposal');
    const monthlyNewProposals = await this.countNewContent(
      'monthly',
      'proposal',
    );

    //Log stats
    const statsPoint = new StatsLog();
    statsPoint.activeUsersDaily = dailyActiveUsers;
    statsPoint.activeUsersWeekly = weeklyActiveUsers;
    statsPoint.activeUsersMonthly = monthlyActiveUsers;
    statsPoint.newUsersDaily = dailyNewUsers;
    statsPoint.newUsersWeekly = weeklyNewUsers;
    statsPoint.newUsersMonthly = monthlyNewUsers;
    statsPoint.newNeedsDaily = dailyNewNeeds;
    statsPoint.newNeedsWeekly = weeklyNewNeeds;
    statsPoint.newNeedsMonthly = monthlyNewNeeds;
    statsPoint.newPortfoliosDaily = dailyNewPortfolios;
    statsPoint.newPortfoliosWeekly = weeklyNewPortfolios;
    statsPoint.newPortfoliosMonthly = monthlyNewPortfolios;
    statsPoint.newProjectsDaily = dailyNewProjects;
    statsPoint.newProjectsWeekly = weeklyNewProjects;
    statsPoint.newProjectsMonthly = monthlyNewProjects;
    statsPoint.newProposalsDaily = dailyNewProposals;
    statsPoint.newProposalsWeekly = weeklyNewProposals;
    statsPoint.newProposalsMonthly = monthlyNewProposals;

    this.statsRepository.save(statsPoint);
  }
}
