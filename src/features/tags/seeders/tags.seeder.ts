import { Injectable } from '@nestjs/common';
import { DataFactory, Seeder } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagsSeeder implements Seeder {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  async seed(): Promise<any> {
    if ((await this.tagsRepository.count()) > 0) {
      return;
    }
    const tags = DataFactory.createForClass(Tag).generate(200);
    this.tagsRepository.save(tags);
    return;
  }

  async drop(): Promise<any> {
    //const qb = this.usersRepository.createQueryBuilder();
    return; // qb.delete().from(User, 'user').execute();
  }
}
