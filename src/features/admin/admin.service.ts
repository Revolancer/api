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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectQueue('admin') private adminQueue: Queue<AdminJob>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
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
        'user.id, profile.slug, profile.profile_image, profile.first_name, profile.last_name, roles.role',
      )
      .leftJoin('profile.user', 'user')
      .leftJoin('user.roles', 'roles')
      .where("roles.role != 'user'")
      .orderBy('user.created_at', 'ASC')
      .execute();
  }

  async listUsersForAdmin(page: number, sortBy: string, order: string) {
    const allowedSortBy = ['first_name', 'last_name', 'slug', 'created_at'];
    const allowedOrder = ['desc', 'asc'];

    if (!allowedSortBy.includes(sortBy)) {
      throw new BadRequestException(
        `sortBy should be one of these - ${allowedSortBy
          .map((sb) => `"${sb}"`)
          .join(' ')}`,
      );
    }

    if (!allowedOrder.includes(order.toLowerCase())) {
      throw new BadRequestException(
        'order can either be "asc"(ascending) or "desc"(descending)',
      );
    }
    return this.userProfileRepository
      .find({
        relations: ['user.roles'],
        select: [
          'id',
          'first_name',
          'last_name',
          'created_at',
          'profile_image',
          'slug',
        ],
        where: { onboardingStage: 4 },
        order: { [sortBy]: order },
        skip: 20 * (page - 1),
        take: 20,
      })
      .then((userProfiles) => {
        return userProfiles.map((profile) => ({
          ...profile,
          roles: profile.user.roles.map((role) => role.role),
        }));
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
