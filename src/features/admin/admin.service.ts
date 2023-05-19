import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/userprofile.entity';
import { DateTime } from 'luxon';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { NeedPost } from '../need/entities/need-post.entity';
import { Proposal } from '../need/entities/proposal.entity';

@Injectable()
export class AdminService {
  constructor(
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
  ) {}

  countUsers() {
    return this.userRepository.count();
  }

  countDau() {
    const yesterday = DateTime.now().minus({ day: 1 }).toJSDate();
    return this.userProfileRepository.count({
      where: { last_active: MoreThanOrEqual(yesterday) },
    });
  }

  countWau() {
    const lastWeek = DateTime.now().minus({ day: 7 }).toJSDate();
    return this.userProfileRepository.count({
      where: { last_active: MoreThanOrEqual(lastWeek) },
    });
  }

  countMau() {
    const lastMonth = DateTime.now().minus({ day: 28 }).toJSDate();
    return this.userProfileRepository.count({
      where: { last_active: MoreThanOrEqual(lastMonth) },
    });
  }

  countDailyPortfolios() {
    const yesterday = DateTime.now().minus({ day: 1 }).toJSDate();
    return this.portfolioRespository.count({
      where: { created_at: MoreThanOrEqual(yesterday) },
    });
  }

  countDailyNeeds() {
    const yesterday = DateTime.now().minus({ day: 1 }).toJSDate();
    return this.needRespository.count({
      where: { created_at: MoreThanOrEqual(yesterday) },
    });
  }

  countDailyProposals() {
    const yesterday = DateTime.now().minus({ day: 1 }).toJSDate();
    return this.proposalRespository.count({
      where: { created_at: MoreThanOrEqual(yesterday) },
    });
  }

  countWeeklyPortfolios() {
    const lastWeek = DateTime.now().minus({ day: 7 }).toJSDate();
    return this.portfolioRespository.count({
      where: { created_at: MoreThanOrEqual(lastWeek) },
    });
  }

  countWeeklyNeeds() {
    const lastWeek = DateTime.now().minus({ day: 7 }).toJSDate();
    return this.needRespository.count({
      where: { created_at: MoreThanOrEqual(lastWeek) },
    });
  }

  countWeeklyProposals() {
    const lastWeek = DateTime.now().minus({ day: 7 }).toJSDate();
    return this.proposalRespository.count({
      where: { created_at: MoreThanOrEqual(lastWeek) },
    });
  }

  countMonthlyPortfolios() {
    const lastMonth = DateTime.now().minus({ day: 28 }).toJSDate();
    return this.portfolioRespository.count({
      where: { created_at: MoreThanOrEqual(lastMonth) },
    });
  }

  countMonthlyNeeds() {
    const lastMonth = DateTime.now().minus({ day: 28 }).toJSDate();
    return this.needRespository.count({
      where: { created_at: MoreThanOrEqual(lastMonth) },
    });
  }

  countMonthlyProposals() {
    const lastMonth = DateTime.now().minus({ day: 28 }).toJSDate();
    return this.proposalRespository.count({
      where: { created_at: MoreThanOrEqual(lastMonth) },
    });
  }

  countDailyNewUsers() {
    const yesterday = DateTime.now().minus({ day: 1 }).toJSDate();
    return this.userProfileRepository.count({
      where: { created_at: MoreThanOrEqual(yesterday) },
    });
  }

  countWeeklyNewUsers() {
    const lastWeek = DateTime.now().minus({ day: 7 }).toJSDate();
    return this.userProfileRepository.count({
      where: { created_at: MoreThanOrEqual(lastWeek) },
    });
  }

  countMonthlyNewUsers() {
    const lastMonth = DateTime.now().minus({ day: 28 }).toJSDate();
    return this.userProfileRepository.count({
      where: { created_at: MoreThanOrEqual(lastMonth) },
    });
  }
}
