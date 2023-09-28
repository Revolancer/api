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
import { UploadService } from '../upload/upload.service';
import { AdminTask } from './admintask.type';
import { Queue } from 'bull';
import { AdminJob } from './queue/admin.job';
import { InjectQueue } from '@nestjs/bull';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/userrole.entity';
import { Onboarding3Dto } from '../users/dto/onboarding3.dto';
import { TagsService } from '../tags/tags.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Project } from '../projects/entities/project.entity';

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
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private creditService: CreditsService,
    private uploadService: UploadService,
    private tagsService: TagsService,
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

  async deleteUsers(users: string[]) {
    const qb = this.userRepository.createQueryBuilder('user');

    const usersToDelete: { id: string; role: string }[] = await qb
      .select('user.id, role.role')
      .where('user.id IN(:...selectedUsers)', { selectedUsers: users })
      .leftJoin('user.roles', 'role')
      .execute();
    const notAllowedUsersPresent = usersToDelete.some(
      (u) =>
        u.role == 'admin' || u.role == 'moderator' || u.role == 'stats_viewer',
    );
    if (notAllowedUsersPresent) {
      throw new BadRequestException(
        'users with admin, moderator and stats_viewer can not be deleted.',
      );
    }

    try {
      users.forEach(async (user) => {
        await this.softDeleteUser(user);
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException('User Id does not exist.');
    }
    return usersToDelete;
  }

  async softDeleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.deleted_at = new Date();

    await this.userRepository.save(user);
  }

  async changeRole(users: string[], role: string) {
    for (const userId of users) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: { roles: true },
      });

      if (user && user.roles) {
        // delete every other role except user role
        user.roles.forEach(async (role: UserRole) => {
          if (role.role != 'user') {
            await this.userRoleRepository.remove([role]);
          }
        });

        user.roles = user?.roles.filter(
          (role: UserRole) => role.role == 'user',
        );
        try {
          // create new role
          const roleRepo = await this.userRoleRepository.create({
            role: role,
            user: user,
          });
          const roleObj = await this.userRoleRepository.save(roleRepo);
          if (user.roles[0].role != role && roleObj) {
            user.roles = [...user.roles, roleObj];
          }

          // save newly added role
          this.userRepository.save(user);
        } catch (err) {
          console.log(err);
        }
      }
    }
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
      .select([
        'userProfile.id',
        'userProfile.first_name',
        'userProfile.last_name',
        'userProfile.created_at',
        'userProfile.profile_image',
        'userProfile.slug',
        'user.id',
        'user.email',
        'user.id',
      ])
      .leftJoinAndSelect('user.roles', 'roles')
      .where(
        'user.deleted_at IS NULL AND userProfile.onboardingStage = :onboardingStage',
        {
          onboardingStage: 4,
        },
      )
      .skip(nPerPage * (page - 1))
      .take(nPerPage);

    if (searchTerms.length > 0) {
      userProfilesQuery.andWhere(
        `(userProfile.first_name ILIKE ANY(:searchTerms) OR userProfile.last_name ILIKE ANY(:searchTerms) OR CONCAT(userProfile.first_name, ' ', userProfile.last_name) ILIKE ANY(:searchTerms) OR userProfile.slug ILIKE ANY(:searchTerms) OR user.email LIKE ANY(:strictSearchTerms))`,
        {
          searchTerms: searchTerms.map((term) => `%${term.toLowerCase()}%`),
          strictSearchTerms: searchTerms,
        },
      );
    }

    userProfilesQuery.orderBy(`userProfile.${sortBy}`, order);
    const [userProfiles, count] = await userProfilesQuery.getManyAndCount();
    const data = userProfiles
      .filter((profile) => profile.user?.id)
      .map((profile) => ({
        ...profile,
        roles: profile.user.roles.map((role) => role.role),
        email: profile.user.email,
        user_id: profile.user.id,
        user: undefined,
      }));

    return { data, totalPages: Math.ceil(count / nPerPage) };
  }

  async getUserActiveProjectsForAdmin(id: string) {
    if (!isValidUUID(id)) throw new BadRequestException('Invalid ID Format');
    return this.projectRepository.find({
      where: [
        { client: { id: id }, status: 'active' },
        { contractor: { id: id }, status: 'active' },
      ],
      relations: ['client', 'contractor', 'need'],
      select: {
        id: true,
        client: { id: true },
        contractor: { id: true },
        credits: true,
        status: true,
        outcome: true,
        created_at: true,
      },
    });
  }

  async countUserActiveProjectsForAdmin(id: string) {
    return this.projectRepository.count({
      where: [
        { client: { id: id }, status: 'active' },
        { contractor: { id: id }, status: 'active' },
      ],
      relations: ['client', 'contractor'],
      select: { client: { id: true }, contractor: { id: true } },
    });
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

  async getUserEmailPrefs(id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    return this.usersService.getUserEmailPrefs(user);
  }

  async setUserNameByAdmin(
    userId: string,
    firstName: string,
    lastName: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!(user instanceof User)) {
      throw new NotFoundException();
    }
    await this.usersService.setUserName(user, {
      first_name: firstName,
      last_name: lastName,
    });
  }

  async setUserTaglineByAdmin(userId: string, tagline: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!(user instanceof User)) {
      throw new NotFoundException();
    }
    await this.usersService.setUserTagline(user, { tagline });
  }

  async setUserAboutByAdmin(userId: string, about: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!(user instanceof User)) {
      throw new NotFoundException();
    }
    await this.usersService.setUserAbout(user, {
      about,
    });
  }

  async setUserSocialsByAdmin(userId: string, links: string[]) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!(user instanceof User)) {
      throw new NotFoundException();
    }
    await this.usersService.updateSocialLinks(user, links);
  }

  async setUserLocationByAdmin(
    userId: string,
    location: UpdateLocationDto['location'],
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!(user instanceof User)) {
      throw new NotFoundException();
    }
    await this.usersService.setUserLocation(user, { location });
  }

  async setUserProfileImageByAdmin(userId: string, profileImage: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!(user instanceof User)) {
      throw new NotFoundException();
    }
    await this.usersService.setUserProfileImage(user, { profileImage });
  }

  async setUserSkillsByAdmin(userId: string, skills: Onboarding3Dto['skills']) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!(user instanceof User)) {
      throw new NotFoundException();
    }
    await this.usersService.setUserSkills(user, { skills });
  }
}
