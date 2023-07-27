import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class NeedService {
  constructor(
    @InjectRepository(NeedPost)
    private postRepository: Repository<NeedPost>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    private tagsService: TagsService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
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

  async getPostsForUser(uid: string, includeAll = false) {
    try {
      const now = DateTime.now().toJSDate();
      const where = includeAll
        ? []
        : [
            { user: { id: uid }, unpublish_at: IsNull() },
            { user: { id: uid }, unpublish_at: MoreThan(now) },
          ];
      const posts = this.postRepository.find({
        where,
        relations: ['tags'],
        select: { user: { id: true } },
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
      take: 250,
    });
  }

  async createProposal(user: User, needId: string, body: CreateProposalDto) {
    if (
      !Number.isSafeInteger(body.estHours) ||
      !Number.isSafeInteger(body.price)
    ) {
      throw new BadRequestException();
    }
    const need = await this.postRepository.findOne({
      where: { id: needId },
      relations: ['user'],
    });
    if (!need) throw new NotFoundException();
    const post = new Proposal();
    post.message = body.message;
    post.estimate_hours = body.estHours;
    post.price = body.price;
    post.need = need;
    post.user = user;
    const newPost = await this.proposalRepository.save(post);

    this.mailService.scheduleMail(need.user, 'proposal_new', {
      need: need,
      proposal: newPost,
      someone: user,
    });
    const proposalCount = await this.countProposals(need.user, need.id);
    this.notificationsService.createOrUpdate(
      need.user,
      `Your need ${need.title} has ${proposalCount} proposals`,
      `need-proposals-${need.id}`,
      `/n/${need.id}`,
    );
    return newPost.id;
  }

  /**
   * Check proposals for a given need
   * @param user The user querying the proposals
   * @param needId The need to check for proposals
   * @returns Any proposls you have permission to see. Only your own if this is not your need.
   */
  async getProposals(user: User, needId: string) {
    const need = await this.postRepository.findOne({
      where: { id: needId },
      relations: ['user'],
      select: { user: { id: true } },
    });
    if (!need) throw new NotFoundException();
    if (need.user.id == user.id) {
      return this.proposalRepository.find({
        where: { need: { id: need.id } },
        relations: ['user', 'need'],
        select: { user: { id: true } },
      });
    } else {
      return this.proposalRepository.find({
        where: { need: { id: need.id }, user: { id: user.id } },
        relations: ['user', 'need'],
        select: { user: { id: true } },
      });
    }
  }

  /**
   * Check proposals for a given need
   * @param user The user querying the proposals
   * @param needId The need to check for proposals
   * @returns Any proposls you have permission to see. Only your own if this is not your need.
   */
  async getProposalsByUser(user: User) {
    return this.proposalRepository.find({
      where: {
        user: { id: user.id },
        need: [
          { unpublish_at: MoreThan(DateTime.now().toJSDate()) },
          { unpublish_at: IsNull() },
        ],
      },
      relations: ['need', 'need.user'],
    });
  }

  /**
   * Check proposals for a given need
   * @param user The user querying the proposals
   * @param needId The need to check for proposals
   * @returns Any proposls you have permission to see. Only your own if this is not your need.
   */
  async countProposals(user: User, needId: string) {
    const need = await this.postRepository.findOne({
      where: { id: needId },
      relations: ['user'],
      select: { user: { id: true } },
    });
    if (!need) throw new NotFoundException();
    if (need.user.id == user.id) {
      return this.proposalRepository.count({
        where: { need: { id: need.id } },
        relations: ['user', 'need'],
        select: { user: { id: true } },
      });
    } else {
      return this.proposalRepository.count({
        where: { need: { id: need.id }, user: { id: user.id } },
        relations: ['user', 'need'],
        select: { user: { id: true } },
      });
    }
  }

  async deleteProposal(user: User, id: string) {
    const proposal = await this.proposalRepository.findOne({
      where: { id: id, user: { id: user.id } },
    });
    if (!proposal) throw new NotFoundException();
    this.proposalRepository.softRemove(proposal);
  }

  async getNeed(id: string) {
    try {
      return this.postRepository.findOneOrFail({
        where: { id: id },
        relations: ['user'],
        select: { user: { id: true } },
      });
    } catch (err) {
      return false;
    }
  }

  async getProposal(id: string) {
    try {
      return this.proposalRepository.findOneOrFail({
        where: { id: id },
        relations: ['user', 'need'],
        select: { user: { id: true }, need: { id: true } },
      });
    } catch (err) {
      return false;
    }
  }

  async unPublishNeed(id: string) {
    const now = DateTime.now().toJSDate();
    const need = await this.postRepository.findOneOrFail({
      where: [
        { id: id, unpublish_at: IsNull() },
        { id: id, unpublish_at: MoreThan(now) },
      ],
      relations: ['user'],
    });
    const unpublish = DateTime.now().minus({ hour: 1 }).toJSDate();
    need.unpublish_at = unpublish;
    this.notificationsService.deleteByKey(
      need.user,
      `need-proposals-${need.id}`,
    );
    this.postRepository.save(need);
  }

  async delistNeed(user: User, id: string) {
    const need = await this.postRepository.findOne({
      where: { id: id, user: { id: user.id } },
    });
    if (!need) {
      throw new NotFoundException();
    }

    try {
      this.unPublishNeed(id);
    } catch (err) {}
  }
}
