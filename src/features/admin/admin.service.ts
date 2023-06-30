import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/userprofile.entity';
import { DateTime } from 'luxon';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { NeedPost } from '../need/entities/need-post.entity';
import { Proposal } from '../need/entities/proposal.entity';
import { UserReferrer } from '../users/entities/userreferrer.entity';
import { AddCreditsDto } from './dto/add-credits.dto';
import { validate as isValidUuid } from 'uuid';
import { CreditsService } from '../credits/credits.service';
import { ImportUsersDto } from './dto/import-users.dto';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import { UploadService } from '../upload/upload.service';
import { AdminTask } from './admintask.type';
import { Queue } from 'bull';
import { AdminJob } from './queue/admin.job';
import { InjectQueue } from '@nestjs/bull';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectQueue('admin') private adminQueue: Queue<AdminJob>,
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
    @InjectRepository(UserReferrer)
    private referrerRepository: Repository<UserReferrer>,
    private creditService: CreditsService,
    private uploadService: UploadService,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  /**
   * Use this method to queue an email
   * Avoids doing expensive API calls before returning account details to new user
   * @param user The user to link
   */
  async scheduleTask(
    user: User,
    task: AdminTask,
    extraData: { [key: string]: any } = {},
  ): Promise<void> {
    await this.adminQueue.add(
      {
        user: { ...user, password: '' },
        task,
        extraData,
      },
      {
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );
  }

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

  async countReferrals() {
    const qb = this.referrerRepository.createQueryBuilder('user_referrer');
    return await qb
      .select('user_referrer.referrer as referrer')
      .addSelect('COUNT(*) as count')
      .groupBy('user_referrer.referrer')
      .getRawMany();
  }

  async listAllUsers() {
    return this.userProfileRepository.find({
      select: { slug: true, created_at: true },
      where: { onboardingStage: 4 },
      order: { created_at: 'DESC' },
    });
  }

  async addCredits(body: AddCreditsDto) {
    let user: User | undefined = undefined;
    if (!isValidUuid(body.recipient)) {
      const userProfile = await this.userProfileRepository.findOne({
        where: { slug: body.recipient },
        relations: ['user'],
      });
      if (userProfile?.user) {
        user = userProfile?.user;
      }
    } else {
      const maybeUser = await this.userRepository.findOne({
        where: { id: body.recipient },
      });
      if (maybeUser) {
        user = maybeUser;
      }
    }

    if (!user) {
      throw new NotFoundException();
    }

    this.creditService.addOrRemoveUserCredits(user, body.amount, body.reason);
  }

  async importUsers(admin: User, body: ImportUsersDto) {
    this.scheduleTask(admin, 'import_users', { url: body.userCsv });
  }

  async runUserImport(user: User, data: { [key: string]: any }) {
    if (!data.url) {
      throw new Error(`No url was passed`);
    }
    await axios
      .get(data.url)
      .then((res) => res.data)
      .then((data) => {
        return parse(data, { columns: true });
      })
      .then(async (records) => {
        if (records.length < 1) {
          throw new Error(`No users found to import`);
        }
        for (const record of records) {
          this.scheduleTask(user, 'import_single_user', {
            email: record.user_email,
          });
        }
      })
      .then(() => {
        this.uploadService.deleteFile(this.uploadService.urlToPath(data.url));
      })
      .catch((err) => {
        throw new Error(err);
      });
  }

  async runSingleUserImport(user: User, data: { [key: string]: any }) {
    const email = data.email;
    if (!email) {
      throw new Error(`No email was passed`);
    }
    const existing_user = await this.userRepository.findOne({
      where: { email: email },
    });
    if (!existing_user) {
      this.usersService.importFromClassic(email);
    }
  }

  async deleteUser(id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    this.usersService.deleteUser(user);
  }
}
