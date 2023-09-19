import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/userprofile.entity';
import { AddCreditsDto } from './dto/add-credits.dto';
import { validate as isValidUUID } from 'uuid';
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
import { UserRole } from '../users/entities/userrole.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectQueue('admin') private adminQueue: Queue<AdminJob>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private creditService: CreditsService,
    private uploadService: UploadService,
    private usersService: UsersService,
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

  async listAllUsers() {
    return this.userProfileRepository.find({
      select: { slug: true, created_at: true },
      where: { onboardingStage: 4 },
      order: { created_at: 'DESC' },
    });
  }

  async listUsersWithRoles() {
    const qb = this.userProfileRepository.createQueryBuilder('profile');
    return qb
      .select(
        'user.id, user.email, profile.slug, profile.profile_image, profile.first_name, profile.last_name, roles.role',
      )
      .leftJoin('profile.user', 'user')
      .leftJoin('user.roles', 'roles')
      .where("roles.role != 'user'")
      .orderBy('user.created_at', 'ASC')
      .execute();
  }

  async getRolesForUser(id: string) {
    if (!isValidUUID(id)) throw new BadRequestException('Invalid ID Format');
    return this.userRoleRepository.find({
      select: { role: true },
      where: { user: { id } },
    });
  }

  async listUsersForAdmin(
    page: number,
    sortBy: string,
    order: 'ASC' | 'DESC' | undefined,
    search: string,
  ) {
    const allowedSortBy = ['first_name', 'last_name', 'slug', 'created_at'];
    const allowedOrder = ['ASC', 'DESC'];
    const searchTerms = search
      ? search
          .split(',')
          .map((term) => term.trim().toLowerCase())
          .filter((term) => term != '')
      : [];

    const nPerPage = 20;

    if (!allowedSortBy.includes(sortBy)) {
      throw new BadRequestException(
        `sortBy should be one of these - ${allowedSortBy
          .map((sb) => `"${sb}"`)
          .join(' ')}`,
      );
    }

    if (order && !allowedOrder.includes(order.toUpperCase())) {
      throw new BadRequestException(
        'order can either be "asc"(ascending) or "desc"(descending)',
      );
    }
    const userProfilesQuery = this.userProfileRepository
      .createQueryBuilder('userProfile')
      .leftJoinAndSelect('userProfile.user', 'user')
      .leftJoinAndSelect('user.roles', 'roles')
      .select([
        'userProfile.id',
        'userProfile.first_name',
        'userProfile.last_name',
        'userProfile.created_at',
        'userProfile.profile_image',
        'userProfile.slug',
        'user.id',
        'user.email',
        'roles.role',
      ])
      .where('userProfile.onboardingStage = :onboardingStage', {
        onboardingStage: 4,
      });

    if (searchTerms.length > 0) {
      userProfilesQuery.andWhere(
        `(userProfile.first_name ILIKE ANY(:searchTerms) OR userProfile.last_name ILIKE ANY(:searchTerms) OR CONCAT(userProfile.first_name, ' ', userProfile.last_name) ILIKE ANY(:searchTerms) OR userProfile.slug ILIKE ANY(:searchTerms) OR user.email LIKE ANY(:strictSearchTerms))`,
        {
          searchTerms: searchTerms.map((term) => `%${term.toLowerCase()}%`),
          strictSearchTerms: searchTerms,
        },
      );
    }

    userProfilesQuery
      .orderBy(`userProfile.${sortBy}`, order)
      .skip(nPerPage * (page - 1))
      .take(nPerPage);
    const [userProfiles, count] = await userProfilesQuery.getManyAndCount();
    const data = userProfiles.map((profile) => ({
      ...profile,
      roles: profile.user.roles.map((role) => role.role),
      email: profile.user.email,
      id: profile.user.id,
      user: undefined,
    }));

    return { data, totalPages: Math.ceil(count / nPerPage) };
  }

  async addCredits(body: AddCreditsDto) {
    let user: User | undefined = undefined;
    if (!isValidUUID(body.recipient)) {
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

  async deleteUser(id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    this.usersService.deleteUser(user);
  }
}
