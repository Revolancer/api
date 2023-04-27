import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
//import { Subscription } from 'chargebee-typescript/lib/resources';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { Not, Repository } from 'typeorm';
//import { ChargebeeService } from '../chargebee/chargebee.service';
import { MailService } from '../mail/mail.service';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { UploadService } from '../upload/upload.service';
import { Onboarding1Dto } from './dto/onboarding1.dto';
import { Onboarding2Dto } from './dto/onboarding2.dto';
import { Onboarding3Dto } from './dto/onboarding3.dto';
import { ProfileImageUpdateDto } from './dto/profileimageupdate.dto';
import { SkillsUpdateDto } from './dto/skillsupdate.dto';
import { TimezoneUpdateDto } from './dto/timezoneupdate.dto';
import { User } from './entities/user.entity';
import { UserConsent } from './entities/userconsent.entity';
import { UserProfile } from './entities/userprofile.entity';
import { UserRole } from './entities/userrole.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
    @InjectRepository(UserConsent)
    private userConsentRepository: Repository<UserConsent>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => MailService))
    private mailService: MailService, //private chargebeeService: ChargebeeService,
    private uploadService: UploadService,
    private tagsService: TagsService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['roles'],
    });
  }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      relations: ['roles'],
      where: { id: id },
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      relations: ['roles'],
      where: { email: email },
    });
    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (user === null) {
      return;
    }
    await this.usersRepository.softRemove(user);
  }

  async create(
    password: string,
    email?: string,
    marketingFirstParty = false,
    marketingThirdParty = false,
  ): Promise<string> {
    const partial = this.usersRepository.create();
    if (typeof email !== 'undefined') {
      partial.email = email;
      if ((await this.findOneByEmail(email)) !== null) {
        throw new EmailExistsError();
      }
    }
    partial.password = await argon2.hash(password);
    const user = await this.usersRepository.save(partial);
    await this.addRole(user, 'user');
    await this.createBlankProfile(user);
    this.addConsent(user, 'terms');
    if (marketingFirstParty) {
      this.addConsent(user, 'marketing-firstparty');
    }
    if (marketingThirdParty) {
      this.addConsent(user, 'marketing-thirdparty');
    }
    //Link to chargebee
    //await this.chargebeeService.createRemoteAndLink(user);
    return user.id;
  }

  async addRole(user: User, role: string): Promise<void> {
    await this.userRolesRepository.upsert(
      {
        user: { id: user.id },
        role: role,
      },
      ['user', 'role'],
    );
  }

  async createBlankProfile(user: User): Promise<void> {
    await this.userProfileRepository.insert({
      user: { id: user.id },
    });
  }

  getProfile(user: User): Promise<UserProfile> {
    return this.userProfileRepository.findOneByOrFail({
      user: { id: user.id },
    });
  }

  async addConsent(user: User, consentFor: string): Promise<void> {
    await this.userConsentRepository.insert({
      user: user,
      consent_for: consentFor,
    });
  }

  async getEmailVerifyToken(user: User): Promise<string> {
    return this.jwtService.sign(
      { purpose: 'verify_email', sub: user.id },
      { expiresIn: '7 days' },
    );
  }

  async getPasswordResetToken(user: User): Promise<string> {
    return this.jwtService.sign(
      { purpose: 'reset_password', sub: user.id },
      { expiresIn: '1 hour' },
    );
  }

  async sendResetPassword(email: string): Promise<void> {
    const user = await this.findOneByEmail(email);
    if (!(user instanceof User)) return;

    this.mailService.scheduleMail(user, 'password_reset');
  }

  /*
  async getSubscriptionStatus(user: User) {
    const subscription = {
      active: false, // is currently active?
      type: 'none', // one of ['none', 'paid', 'trial']
      expires: 0, // timestamp of expiry
      card_status: 'no_card',
    };

    const currentDate = new Date();
    const currentTime = currentDate.getTime();

    const customer = await this.chargebeeService.findOneByUser(user);
    let sub: void | Subscription;
    if (customer != null) {
      sub = await this.chargebeeService.getSubscription(customer);
      subscription.card_status = await this.chargebeeService.getCardStatus(
        customer,
      );
      if (sub) {
        if (sub.status == 'in_trial') {
          subscription.expires = sub.trial_end ?? 0;
          subscription.type = 'trial';
        } else {
          subscription.type = 'paid';
          subscription.expires = sub.current_term_end ?? 0;
        }
      }
    }
    subscription.active = subscription.expires * 1000 > currentTime;
    return subscription;
  }
*/

  async doOnboardingStage1(user: User, body: Onboarding1Dto) {
    if (await this.checkUsernameAvailability(user, body.userName)) {
      const loadedUserProfile = await this.getProfile(user);
      loadedUserProfile.first_name = body.firstName;
      loadedUserProfile.last_name = body.lastName;
      loadedUserProfile.slug = body.userName;
      loadedUserProfile.date_of_birth = body.dateOfBirth;
      loadedUserProfile.onboardingStage = 2;
      this.userProfileRepository.save(loadedUserProfile);
    }
  }

  async doOnboardingStage2(user: User, body: Onboarding2Dto) {
    const loadedUserProfile = await this.getProfile(user);
    loadedUserProfile.experience = body.experience;
    loadedUserProfile.currency = body.currency;
    loadedUserProfile.hourly_rate = body.hourlyRate;
    loadedUserProfile.onboardingStage = 3;
    this.userProfileRepository.save(loadedUserProfile);
  }

  async loadSkillsFromRequest(skills: Onboarding3Dto['skills']) {
    const loadedSkills: Tag[] = [];
    for (const skill of skills) {
      const loadedSkill = await this.tagsService.findOne(skill.id);
      if (loadedSkill instanceof Tag) {
        loadedSkills.push(loadedSkill);
      }
    }
    return loadedSkills;
  }

  async doOnboardingStage3(user: User, body: Onboarding3Dto) {
    const loadedUserProfile = await this.getProfile(user);
    if (!this.uploadService.storeFile(user, body.profileImage)) {
      return { success: false };
    }
    const loadedSkills = await this.loadSkillsFromRequest(body.skills);
    if (loadedSkills.length > 20 || loadedSkills.length < 3) {
      return { success: false };
    }
    loadedUserProfile.skills = loadedSkills;
    loadedUserProfile.timezone = body.timezone;
    loadedUserProfile.profile_image = body.profileImage;
    loadedUserProfile.onboardingStage = 4;
    this.userProfileRepository.save(loadedUserProfile);
  }

  /**
   * Check the availability of a given username
   * @param user The current user
   * @param username the username to test for availability
   * @returns true if the passed username can be used
   */
  async checkUsernameAvailability(
    user: User,
    username: string,
  ): Promise<boolean> {
    //Test against blacklist
    const blacklist = [
      'profile',
      'admin',
      'revolancer',
      'null',
      'staff',
      'moderator',
    ];
    for (const i in blacklist) {
      const word = blacklist[i];
      if (username.includes(word)) {
        return false;
      }
    }
    return (
      null ==
      (await this.userProfileRepository.findOne({
        where: {
          slug: username,
          user: { id: Not(user.id) },
        },
      }))
    );
  }

  async getUserProfileDataBySlug(
    slug: string,
  ): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { slug: slug },
      relations: ['user'],
      select: {
        id: true,
        first_name: true,
        last_name: true,
        profile_image: true,
        timezone: true,
        user: {
          id: true,
          roles: false,
        },
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async getUserProfileData(
    id: string,
  ): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: id } },
      relations: ['user'],
      select: {
        id: true,
        first_name: true,
        last_name: true,
        profile_image: true,
        timezone: true,
        user: {
          id: true,
          roles: false,
        },
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async getUserSkills(
    id: string,
  ): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: id } },
      relations: ['skills'],
      select: {
        id: true,
        skills: {
          id: true,
          text: true,
        },
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async setUserSkills(
    user: User,
    body: SkillsUpdateDto,
  ): Promise<{ success: boolean }> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!(profile instanceof UserProfile)) {
      return { success: false };
    }
    const loadedSkills = await this.loadSkillsFromRequest(body.skills);
    if (loadedSkills.length > 20 || loadedSkills.length < 3) {
      return { success: false };
    }
    profile.skills = loadedSkills;
    this.userProfileRepository.save(profile);
    return { success: true };
  }

  async getUserProfileImage(
    id: string,
  ): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: id } },
      select: {
        id: true,
        profile_image: true,
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async setUserProfileImage(
    user: User,
    body: ProfileImageUpdateDto,
  ): Promise<{ success: boolean }> {
    const loadedUserProfile = await this.getProfile(user);
    if (!this.uploadService.storeFile(user, body.profileImage)) {
      return { success: false };
    }
    loadedUserProfile.profile_image = body.profileImage;
    this.userProfileRepository.save(loadedUserProfile);
    return { success: true };
  }

  async getUserTimezone(
    id: string,
  ): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: id } },
      select: {
        id: true,
        timezone: true,
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async setUserTimezone(
    user: User,
    body: TimezoneUpdateDto,
  ): Promise<{ success: boolean }> {
    const loadedUserProfile = await this.getProfile(user);
    loadedUserProfile.timezone = body.timezone;
    this.userProfileRepository.save(loadedUserProfile);
    return { success: true };
  }
}
