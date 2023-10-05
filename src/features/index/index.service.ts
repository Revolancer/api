import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { ContentIndex } from './entities/contentindex.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { NeedPost } from '../need/entities/need-post.entity';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';

@Injectable()
export class IndexService {
  constructor(
    @InjectRepository(ContentIndex)
    private contentIndexRepository: Repository<ContentIndex>,
    private userService: UsersService,
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
}
