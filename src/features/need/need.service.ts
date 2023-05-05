import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/createneed.dto';
import { NeedPost } from './entities/need-post.entity';
import { Proposal } from './entities/proposal.entity';
import { CreateProposalDto } from './dto/createproposal.dto';

@Injectable()
export class NeedService {
  constructor(
    @InjectRepository(NeedPost)
    private postRepository: Repository<NeedPost>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
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
          { user: { id: uid }, unpublish_at: MoreThan(now) },
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
          unpublish_at: MoreThan(now),
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

  async createProposal(user: User, needId: string, body: CreateProposalDto) {
    const need = await this.postRepository.findOne({ where: { id: needId } });
    if (!need) throw new NotFoundException();
    const post = new Proposal();
    post.message = body.message;
    post.estimate_hours = body.estHours;
    post.price = body.price;
    post.need = need;
    post.user = user;
    const newPost = await this.proposalRepository.save(post);
    return newPost.id;
  }

  /**
   * Check proposals for a given need
   * @param user The user querying the proposals
   * @param needId The need to check for proposals
   * @returns Any proposls you have permission to see. Only your own if this is not your need.
   */
  async getProposals(user: User, needId: string) {
    const need = await this.postRepository.findOne({ where: { id: needId } });
    if (!need) throw new NotFoundException();
    if (need.user.id == user.id) {
      return this.proposalRepository.find({ where: { need: need } });
    } else {
      return this.proposalRepository.find({
        where: { need: need, user: { id: user.id } },
      });
    }
  }
}
