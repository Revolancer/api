import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { IsNull, LessThan, Repository } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/createneed.dto';
import { NeedPost } from './entities/need-post.entity';

@Injectable()
export class NeedService {
  constructor(
    @InjectRepository(NeedPost)
    private postRepository: Repository<NeedPost>,
    private tagsService: TagsService,
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
    const post = new NeedPost();
    post.user = user;
    post.is_draft = false;
    post.published_at = DateTime.now().toJSDate();
    post.data = body.data;
    post.title = body.title;
    post.tags = await this.loadTagsFromRequest(body.tags);
    if (body?.unpublish_at) {
      post.unpublish_at = body.unpublish_at;
    }
    const newPost = await this.postRepository.save(post);
    return newPost.id;
  }

  async updatePost(user: User, id: string, body: CreatePostDto) {
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
      return newPost.id;
    } catch (err) {
      throw new NotFoundException('Post not found');
    }
  }

  async getPost(id: string) {
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
    try {
      const now = DateTime.now().toJSDate();
      const posts = this.postRepository.find({
        where: [
          { user: { id: uid }, unpublish_at: IsNull() },
          { user: { id: uid }, unpublish_at: LessThan(now) },
        ],
        relations: ['tags'],
        order: { published_at: 'DESC' },
      });
      return posts;
    } catch (err) {
      throw new NotFoundException('Post not found');
    }
  }

  async getPostsForFeed(user: User) {
    const now = DateTime.now().toJSDate();
    return await this.postRepository.find({
      where: [
        {
          is_draft: false,
          published_at: LessThan(now),
          unpublish_at: LessThan(now),
        },
        {
          is_draft: false,
          published_at: LessThan(now),
          unpublish_at: IsNull(),
        },
      ],
      relations: ['tags', 'user'],
      select: {
        user: {
          id: true,
        },
      },
      order: {
        published_at: 'DESC',
      },
    });
  }
}
