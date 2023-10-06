import { Injectable, Logger } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { ContentIndex } from './entities/contentindex.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { NeedPost } from '../need/entities/need-post.entity';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { RedlockService } from '@anchan828/nest-redlock';
import { InjectQueue } from '@nestjs/bull';
import { IndexJob } from './queue/index.job';
import { Queue } from 'bull';
import { DateTime } from 'luxon';

@Injectable()
export class IndexService {
  private readonly logger = new Logger(IndexService.name);
  constructor(
    @InjectRepository(ContentIndex)
    private contentIndexRepository: Repository<ContentIndex>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(NeedPost)
    private needRepository: Repository<NeedPost>,
    @InjectRepository(PortfolioPost)
    private portfolioRepository: Repository<PortfolioPost>,
    private userService: UsersService,
    private readonly redlock: RedlockService,
    @InjectQueue('index') private indexQueue: Queue<IndexJob>,
  ) {}

  async indexUser(user: User) {
    const profile = await this.userService.getProfile(user);
    this.contentIndexRepository.upsert(
      {
        otherId: user.id,
        contentType: 'user',
        title: `${profile.first_name} ${profile.last_name}`,
        body: `${profile.first_name} ${profile.last_name} ${profile.about} ${
          profile.tagline
        } ${profile.skills.map((tag) => tag.text).join(' ')}`,
        tagIds: profile.skills.map((tag) => tag.id),
      },
      { conflictPaths: ['otherId', 'contentType'] },
    );
  }

  editorjsDataToIndexable(data?: string) {
    //TODO: Better indexing to parse out metadata
    return data ?? '';
  }

  indexNeed(need: NeedPost) {
    this.contentIndexRepository.upsert(
      {
        otherId: need.id,
        contentType: 'need',
        title: need.title,
        body: `${need.title} ${this.editorjsDataToIndexable(
          need.data,
        )} ${need.tags.map((tag) => tag.text).join(' ')}`,
        tagIds: need.tags.map((tag) => tag.id),
      },
      { conflictPaths: ['otherId', 'contentType'] },
    );
  }

  indexPortfolio(post: PortfolioPost) {
    this.contentIndexRepository.upsert(
      {
        otherId: post.id,
        contentType: 'portfolio',
        title: post.title,
        body: `${post.title} ${this.editorjsDataToIndexable(
          post.data,
        )} ${post.tags.map((tag) => tag.text).join(' ')}`,
        tagIds: post.tags.map((tag) => tag.id),
      },
      { conflictPaths: ['otherId', 'contentType'] },
    );
  }

  clearIndex() {
    this.logger.log('Wiping index');
    this.contentIndexRepository.clear();
  }

  async indexAllUsers() {
    await this.redlock.using(['index-users'], 30000, async (signal: any) => {
      if (signal.aborted) {
        throw signal.error;
      }
      const countUsers = await this.userRepository.count();
      const pageSize = 50;
      let index = 0;
      while (index < countUsers) {
        const users = await this.userRepository.find({
          take: pageSize,
          skip: index,
          order: { created_at: 'ASC' },
        });
        index += pageSize;
        this.logger.log(`Indexing ${users.length} users`);
        await this.indexQueue.add(
          {
            datatype: 'user',
            users: users,
          },
          {
            removeOnComplete: 100,
            removeOnFail: 1000,
          },
        );
      }
    });
  }

  indexUsers(users: User[]) {
    users.map((user) => this.indexUser(user));
  }

  async indexAllNeeds() {
    await this.redlock.using(['index-needs'], 30000, async (signal: any) => {
      if (signal.aborted) {
        throw signal.error;
      }
      const countNeeds = await this.needRepository.count({
        where: { unpublish_at: MoreThan(DateTime.now().toJSDate()) },
      });
      const pageSize = 50;
      let index = 0;
      while (index < countNeeds) {
        const needs = await this.needRepository.find({
          where: { unpublish_at: MoreThan(DateTime.now().toJSDate()) },
          take: pageSize,
          skip: index,
          order: { created_at: 'ASC' },
        });
        index += pageSize;
        this.logger.log(`Indexing ${needs.length} needs`);
        await this.indexQueue.add(
          {
            datatype: 'need',
            needs: needs,
          },
          {
            removeOnComplete: 100,
            removeOnFail: 1000,
          },
        );
      }
    });
  }

  indexNeeds(needs: NeedPost[]) {
    needs.map((need) => this.indexNeed(need));
  }

  async indexAllPortfolios() {
    await this.redlock.using(
      ['index-portfolios'],
      30000,
      async (signal: any) => {
        if (signal.aborted) {
          throw signal.error;
        }
        const countPortfolios = await this.portfolioRepository.count();
        const pageSize = 50;
        let index = 0;
        while (index < countPortfolios) {
          const portfolios = await this.portfolioRepository.find({
            take: pageSize,
            skip: index,
            order: { created_at: 'ASC' },
          });
          index += pageSize;
          this.logger.log(`Indexing ${portfolios.length} portfolios`);
          await this.indexQueue.add(
            {
              datatype: 'portfolio',
              portfolios: portfolios,
            },
            {
              removeOnComplete: 100,
              removeOnFail: 1000,
            },
          );
        }
      },
    );
  }

  indexPortfolios(posts: PortfolioPost[]) {
    posts.map((post) => this.indexPortfolio(post));
  }

  countIndexedData(type: 'all' | 'need' | 'portfolio' | 'user') {
    let where = {};
    switch (type) {
      case 'need':
      case 'portfolio':
      case 'user':
        where = { datatype: type };
    }

    return this.contentIndexRepository.count({ where });
  }
}
