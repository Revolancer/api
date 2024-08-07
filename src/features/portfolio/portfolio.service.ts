import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { LessThan, Repository } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/createpost.dto';
import { PortfolioPost } from './entities/portfolio-post.entity';
import { validate as isValidUUID } from 'uuid';
import { IndexService } from '../index/index.service';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(PortfolioPost)
    private postRepository: Repository<PortfolioPost>,
    private tagsService: TagsService,
    private indexService: IndexService,
  ) {}

  async loadTagsFromRequest(tags: CreatePostDto['tags']) {
    const loadedTags: Tag[] = [];
    for (const tag of tags) {
      const loadedTag = await this.tagsService.findOne(tag.id);
      if (loadedTag instanceof Tag) {
        loadedTags.push(loadedTag);
      }
    }
    return loadedTags;
  }

  async createPost(user: User, body: CreatePostDto) {
    const post = new PortfolioPost();
    post.user = user;
    post.is_draft = false;
    post.published_at = DateTime.now().toJSDate();
    post.data = body.data;
    post.title = body.title;
    post.tags = await this.loadTagsFromRequest(body.tags);
    const newPost = await this.postRepository.save(post);
    this.indexService.indexPortfolio(newPost);
    return newPost.id;
  }

  async updatePost(user: User, id: string, body: CreatePostDto) {
    if (!isValidUUID(id)) throw new BadRequestException('Invalid ID Format');
    try {
      const post = await this.postRepository.findOneOrFail({
        where: { id: id, user: { id: user.id } },
      });
      post.is_draft = false;
      post.published_at = DateTime.now().toJSDate();
      post.data = body.data;
      post.title = body.title;
      post.tags = await this.loadTagsFromRequest(body.tags);
      const newPost = await this.postRepository.save(post);
      this.indexService.indexPortfolio(newPost);
      return newPost.id;
    } catch (err) {
      throw new NotFoundException('Post not found');
    }
  }

  async deletePost(user: User, id: string) {
    if (!isValidUUID(id)) throw new BadRequestException('Invalid ID Format');
    try {
      this.indexService.deleteIndexEntry('portfolio', id);
      return await this.postRepository
        .createQueryBuilder()
        .softDelete()
        .where({ id: id, user: { id: user.id } })
        .execute();
    } catch (err) {
      throw new NotFoundException('Post not found');
    }
  }

  async getPost(id: string) {
    if (!isValidUUID(id)) throw new BadRequestException('Invalid ID Format');
    try {
      const post = this.postRepository.findOne({
        where: { id: id },
        relations: ['tags', 'user'],
        select: { user: { id: true } },
      });
      return post;
    } catch (err) {
      throw new NotFoundException('Post not found');
    }
  }

  async getPostsForUser(uid: string) {
    if (!isValidUUID(uid)) throw new BadRequestException('Invalid ID Format');
    try {
      const posts = this.postRepository.find({
        where: { user: { id: uid } },
        relations: ['tags', 'user'],
        select: { user: { id: true } },
        order: { published_at: 'DESC' },
      });
      return posts;
    } catch (err) {
      throw new NotFoundException('Post not found');
    }
  }

  //Need to ignore as this is invoked with user
  //Later we will use the user to generate personalised feed
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPostsForFeed(user: User) {
    const now = DateTime.now().toJSDate();
    return await this.postRepository.find({
      where: { is_draft: false, published_at: LessThan(now) },
      relations: ['tags', 'user'],
      select: {
        user: {
          id: true,
        },
      },
      order: {
        published_at: 'DESC',
      },
      take: 250,
    });
  }
}
