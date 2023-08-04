import { Injectable } from '@nestjs/common';
import { DataFactory, Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioPost } from '../entities/portfolio-post.entity';
import { Tag } from 'src/features/tags/entities/tag.entity';
import { User } from 'src/features/users/entities/user.entity';
import { faker } from '@faker-js/faker';

@Injectable()
export class PortfoliosSeeder implements Seeder {
  constructor(
    @InjectRepository(PortfolioPost)
    private portfolioRepository: Repository<PortfolioPost>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed(): Promise<any> {
    if ((await this.portfolioRepository.count()) > 0) {
      return;
    }
    const posts = DataFactory.createForClass(PortfolioPost).generate(600);
    for (const post of posts) {
      const randomTags = await this.tagsRepository
        .createQueryBuilder('tag')
        .select()
        .orderBy('RANDOM()')
        .take(faker.number.int({ min: 3, max: 6 }))
        .getMany();

      post.tags = randomTags;

      const author = await this.userRepository
        .createQueryBuilder('user')
        .select()
        .orderBy('RANDOM()')
        .getOne();

      if (author) {
        post.user = author;
      }

      this.portfolioRepository.save(post);
    }

    return;
  }

  async drop(): Promise<any> {
    //const qb = this.usersRepository.createQueryBuilder();
    return; // qb.delete().from(User, 'user').execute();
  }
}
