import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
//import { Subscription } from 'chargebee-typescript/lib/resources';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { FindOperator, IsNull, LessThan, Not, Repository } from 'typeorm';
//import { ChargebeeService } from '../chargebee/chargebee.service';
import { MailService } from '../mail/mail.service';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { UploadService } from '../upload/upload.service';
import { AboutUpdateDto } from './dto/aboutupdate.dto';
import { Onboarding1Dto } from './dto/onboarding1.dto';
import { Onboarding2Dto } from './dto/onboarding2.dto';
import { Onboarding3Dto } from './dto/onboarding3.dto';
import { ProfileImageUpdateDto } from './dto/profileimageupdate.dto';
import { SkillsUpdateDto } from './dto/skillsupdate.dto';
import { TaglineUpdateDto } from './dto/taglineupdate.dto';
import { TimezoneUpdateDto } from './dto/timezoneupdate.dto';
import { User } from './entities/user.entity';
import { UserConsent } from './entities/userconsent.entity';
import { UserProfile } from './entities/userprofile.entity';
import { UserRole } from './entities/userrole.entity';
import { CreditsService } from '../credits/credits.service';
import { DateTime } from 'luxon';
import { UserReferrer } from './entities/userreferrer.entity';
import { EmailUpdateDto } from './dto/emailupdate.dto ';
import { PasswordUpdateDto } from './dto/passwordupdate.dto';
import { ChangeRateDto } from './dto/changerate.dto';
import { ChangeExperienceDto } from './dto/changeexperience.dto';
import { ChangeEmailPrefsDto } from './dto/changeemailprefs.dto';
import { v4 as uuidv4 } from 'uuid';
import { PortfolioService } from '../portfolio/portfolio.service';
import { NeedService } from '../need/need.service';
import { ProjectsService } from '../projects/projects.service';
import { DeleteAccountDto } from './dto/deleteaccount.dto';
import { Cron } from '@nestjs/schedule';
import { LastMail } from '../mail/entities/last-mail.entity';
import { RedlockService } from '@anchan828/nest-redlock';
import { NeedPost } from '../need/entities/need-post.entity';
import { InjectQueue } from '@nestjs/bull';
import { UserJob } from './queue/user.job';
import { Queue } from 'bull';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { LocationUpdateDto } from './dto/locationupdate.dto';
import { MapsService } from '../maps/maps.service';

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
    @InjectRepository(UserReferrer)
    private userReferrerRepository: Repository<UserReferrer>,
    @InjectRepository(LastMail)
    private lastMailRepository: Repository<LastMail>,
    @InjectRepository(NeedPost)
    private needRepository: Repository<NeedPost>,
    @InjectRepository(PortfolioPost)
    private portfolioRepository: Repository<PortfolioPost>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => MailService))
    private mailService: MailService, //private chargebeeService: ChargebeeService,
    private uploadService: UploadService,
    private tagsService: TagsService,
    private creditsService: CreditsService,
    private portfolioService: PortfolioService,
    private needService: NeedService,
    private projectsService: ProjectsService,
    private mapsService: MapsService,
    private readonly redlock: RedlockService,
    @InjectQueue('user') private userQueue: Queue<UserJob>,
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
      where: { email: new FindOperator('ilike', email) },
    });
    return user;
  }

  /**
   * DANGEROUS! Will return password hash. ONLY to be used for auth
   */
  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email: new FindOperator('ilike', email) },
      select: { password: true },
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

  async importFromClassic(email: string) {
    const uuid = await this.create(uuidv4(), email);
    const account = await this.findOne(uuid);
    if (account) {
      this.mailService.scheduleMail(account, 'account_import');
    }
  }

  async create(
    password: string,
    email?: string,
    marketingFirstParty = false,
    marketingThirdParty = false,
    referrer = '',
  ): Promise<string> {
    const partial = this.usersRepository.create();
    if (typeof email !== 'undefined') {
      partial.email = email.toLowerCase();
      if ((await this.findOneByEmail(partial.email)) !== null) {
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
    if (referrer && referrer != '') {
      const userReferrer = new UserReferrer();
      userReferrer.user = user;
      userReferrer.referrer = referrer;
      this.userReferrerRepository.save(userReferrer);
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

  async getProfile(user: User): Promise<UserProfile> {
    try {
      return this.userProfileRepository.findOneByOrFail({
        user: { id: user.id },
      });
    } catch (e) {
      await this.createBlankProfile(user);
      return this.userProfileRepository.findOneByOrFail({
        user: { id: user.id },
      });
    }
  }

  async markActive(user: User) {
    const profile = await this.userProfileRepository.findOneBy({
      user: { id: user.id },
    });
    if (profile) {
      profile.last_active = DateTime.now().toJSDate();
      this.userProfileRepository.save(profile);
    }
  }

  async getLastActive(user: User) {
    const profile = await this.userProfileRepository.findOneByOrFail({
      user: { id: user.id },
    });
    if (profile.last_active) {
      return DateTime.fromJSDate(profile.last_active);
    }
    return DateTime.fromJSDate(profile.created_at);
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

  async getAccountUpgradeToken(user: User): Promise<string> {
    return this.jwtService.sign(
      { purpose: 'reset_password', sub: user.id },
      { expiresIn: '30 days' },
    );
  }

  async sendResetPassword(email: string): Promise<void> {
    const user = await this.findOneByEmail(email);
    if (!(user instanceof User)) throw new NotFoundException();

    this.mailService.scheduleMail(user, 'password_reset');
  }

  async resetPassword(uid: string, password: string) {
    const loadedUser = await this.usersRepository.findOneBy({
      id: uid,
    });
    if (!loadedUser) {
      throw new NotFoundException();
    }
    loadedUser.password = await argon2.hash(password);
    this.usersRepository.save(loadedUser);
    return { success: true };
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
      if ((loadedUserProfile.onboardingStage ?? 0) >= 2) {
        return { success: true };
      }
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
    if ((loadedUserProfile.onboardingStage ?? 0) >= 3) {
      return { success: true };
    }
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
    if ((loadedUserProfile.onboardingStage ?? 0) >= 4) {
      return { success: true };
    }
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
    this.creditsService.addOrRemoveUserCredits(user, 500, 'Welcome bonus');

    const loadedUser = await this.usersRepository.findOneBy({ id: user.id });
    if (loadedUser && loadedUser.email) {
      this.mailService.scheduleMail(user, 'welcome', {
        portfolio_link: 'https://app.revolancer.com/u/profile',
      });
    }
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
        slug: true,
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

  async setUserLocation(
    user: User,
    body: LocationUpdateDto,
  ): Promise<{ success: boolean }> {
    const timezone = await this.mapsService.placeIdToTimezone(
      body.location.value.place_id,
    );
    const loadedUserProfile = await this.getProfile(user);
    loadedUserProfile.timezone = timezone;
    loadedUserProfile.placeId = body.location.value.place_id;
    this.userProfileRepository.save(loadedUserProfile);
    return { success: true };
  }

  async getUserTagline(
    id: string,
  ): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: id } },
      select: {
        id: true,
        tagline: true,
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async setUserTagline(
    user: User,
    body: TaglineUpdateDto,
  ): Promise<{ success: boolean }> {
    const loadedUserProfile = await this.getProfile(user);
    loadedUserProfile.tagline = body.tagline;
    this.userProfileRepository.save(loadedUserProfile);
    return { success: true };
  }

  async getUserAbout(id: string): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: id } },
      select: {
        id: true,
        about: true,
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async setUserAbout(
    user: User,
    body: AboutUpdateDto,
  ): Promise<{ success: boolean }> {
    const loadedUserProfile = await this.getProfile(user);
    loadedUserProfile.about = body.about;
    this.userProfileRepository.save(loadedUserProfile);
    return { success: true };
  }

  async getUserEmail(user: User) {
    const loadedUser = await this.usersRepository.findOne({
      where: {
        id: user.id,
      },
      select: { id: true, email: true },
    });
    if (!loadedUser) {
      throw new NotFoundException();
    }
    return loadedUser;
  }

  async setUserEmail(
    user: User,
    body: EmailUpdateDto,
  ): Promise<{ success: boolean }> {
    const loadedUser = await this.usersRepository.findOneBy({
      id: user.id,
    });
    if (!loadedUser) {
      throw new NotFoundException();
    }
    const userWithNewEmail = await this.usersRepository.findOneBy({
      email: body.email,
    });
    if (userWithNewEmail) {
      if (userWithNewEmail.id == user.id) {
        return { success: true };
      }
      throw new ConflictException();
    }
    const oldEmail = loadedUser.email ?? body.email;
    loadedUser.email = body.email;
    this.usersRepository.save(loadedUser);
    this.mailService.scheduleMail(loadedUser, 'email_change', {
      old_email: oldEmail,
    });
    return { success: true };
  }

  async setUserPassword(
    user: User,
    body: PasswordUpdateDto,
  ): Promise<{ success: boolean }> {
    const pw = await this.usersRepository.findOne({
      where: { id: user.id },
      select: { password: true },
    });
    const loadedUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!loadedUser || !pw) {
      throw new NotFoundException();
    }
    if (!(await argon2.verify(pw.password, body.password))) {
      throw new UnauthorizedException();
    }
    if (body.newPassword1 !== body.newPassword2) {
      throw new NotAcceptableException();
    }
    loadedUser.password = await argon2.hash(body.newPassword1);
    this.usersRepository.save(loadedUser);
    return { success: true };
  }

  async getUserRate(user: User): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: user.id } },
      select: {
        id: true,
        hourly_rate: true,
        currency: true,
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async setUserRate(user: User, body: ChangeRateDto) {
    const loadedUserProfile = await this.getProfile(user);
    loadedUserProfile.currency = body.currency;
    loadedUserProfile.hourly_rate = body.hourlyRate;
    this.userProfileRepository.save(loadedUserProfile);
  }

  async getUserExperience(
    user: User,
  ): Promise<UserProfile | Record<string, never>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: user.id } },
      select: {
        id: true,
        experience: true,
      },
    });
    if (!(profile instanceof UserProfile)) {
      return {};
    }
    return profile;
  }

  async setUserExperience(user: User, body: ChangeExperienceDto) {
    const loadedUserProfile = await this.getProfile(user);
    loadedUserProfile.experience = body.experience;
    this.userProfileRepository.save(loadedUserProfile);
  }

  async getUserEmailPrefs(user: User) {
    const firstParty = await this.userConsentRepository.findOne({
      where: { user: { id: user.id }, consent_for: 'marketing-firstparty' },
    });
    const thirdParty = await this.userConsentRepository.findOne({
      where: { user: { id: user.id }, consent_for: 'marketing-thirdparty' },
    });
    return {
      firstparty: firstParty == null ? false : true,
      thirdparty: thirdParty == null ? false : true,
    };
  }

  async setUserEmailPrefs(user: User, body: ChangeEmailPrefsDto) {
    const firstParty = await this.userConsentRepository.findOne({
      where: { user: { id: user.id }, consent_for: 'marketing-firstparty' },
    });
    if (body.marketingfirstparty && !firstParty) {
      const consent = new UserConsent();
      consent.user = <any>{ id: user.id };
      consent.consent_for = 'marketing-firstparty';
      this.userConsentRepository.save(consent);
    } else if (firstParty && !body.marketingfirstparty) {
      this.userConsentRepository.remove(firstParty);
    }

    const thirdParty = await this.userConsentRepository.findOne({
      where: { user: { id: user.id }, consent_for: 'marketing-thirdparty' },
    });
    if (body.marketingthirdparty && !thirdParty) {
      const consent = new UserConsent();
      consent.user = <any>{ id: user.id };
      consent.consent_for = 'marketing-thirdparty';
      this.userConsentRepository.save(consent);
    } else if (thirdParty && !body.marketingthirdparty) {
      this.userConsentRepository.remove(thirdParty);
    }
  }

  async deleteAllPortfolios(user: User) {
    const posts = await this.portfolioService.getPostsForUser(user.id);
    for (const post of posts) {
      this.portfolioService.deletePost(user, post.id);
    }
  }

  async deleteAllNeeds(user: User) {
    const posts = await this.needService.getPostsForUser(user.id);
    for (const post of posts) {
      this.needService.delistNeed(user, post.id);
    }
  }

  async resolveProjects(user: User) {
    const projects = await this.projectsService.getActiveProjects(user);
    for (const project of projects) {
      this.projectsService.cancelProjectForDeletedUser(project, user);
    }
  }

  async deleteProfilePII(user: User) {
    const profile = await this.getProfile(user);
    profile.about = <any>null;
    profile.date_of_birth = <any>null;
    profile.currency = <any>null;
    profile.experience = <any>null;
    profile.hourly_rate = <any>null;
    profile.last_active = <any>null;
    profile.skills = [];
    profile.slug = <any>null;
    profile.tagline = <any>null;
    profile.timezone = <any>null;
    profile.first_name = 'Deleted';
    profile.last_name = 'User';
    profile.profile_image =
      'https://app.revolancer.com/img/user/avatar-placeholder.png';
    this.userProfileRepository.save(profile);
    const loadedUser = await this.usersRepository.findOneBy({
      id: user.id,
    });
    if (loadedUser) {
      loadedUser.email = <any>null;
      this.usersRepository.save(loadedUser);
    }
  }

  /**
   * Delete user account, preserving all content but making profile inaccessible
   * Will retain private messages and completed projects.
   * Will end all active projects, notify the other party, and release credits to the other party.
   * Will delist all portfolio posts and needs.
   * Will remove email address and profile slug from account, freeing these for use by other accounts
   * Will replace user profile picture and rename user to 'Deleted User' in case any elements still display profile info
   * TODO: In future, will need to delist any active project requests, outgoing or incoming
   *
   * @param user User account to delete
   */
  async deleteUser(user: User) {
    await this.mailService.scheduleMail(user, 'account_delete');
    this.deleteAllPortfolios(user);
    this.deleteAllNeeds(user);
    this.resolveProjects(user);
    this.deleteProfilePII(user);
  }

  /**
   * Delete Account endpoint - requires verification of user password
   * You probably want deleteUser
   */
  async deleteAccount(user: User, body: DeleteAccountDto) {
    const pw = await this.usersRepository.findOne({
      where: { id: user.id },
      select: { password: true },
    });
    const loadedUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!loadedUser || !pw) {
      throw new NotFoundException();
    }
    if (!(await argon2.verify(pw.password, body.password))) {
      throw new UnauthorizedException();
    }

    this.deleteUser(loadedUser);
  }

  /**
   * Mark user checklist as complete
   */
  async markChecklistComplete(user: User) {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) {
      throw new NotFoundException();
    }
    if (profile.checklist_complete) return;
    profile.checklist_complete = true;
    this.userProfileRepository.save(profile);
    this.creditsService.addOrRemoveUserCredits(user, 50, 'Profile Complete');
  }

  /**
   * Mark user checklist as complete
   */
  async isChecklistComplete(user: User) {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) {
      throw new NotFoundException();
    }
    return profile.checklist_complete;
  }

  async hasPostedNeed(user: User) {
    return (
      (await this.needRepository.count({ where: { user: { id: user.id } } })) >
      0
    );
  }

  async hasPostedPortfolio(user: User) {
    return (
      (await this.portfolioRepository.count({
        where: { user: { id: user.id } },
        withDeleted: true,
      })) > 0
    );
  }

  //@Cron('0 0 * * * *')
  async checkIfUserHasNeeds() {
    await this.redlock.using(['7-day-no-needs'], 30000, async (signal) => {
      if (signal.aborted) {
        throw signal.error;
      }

      const sevenDaysAgo = DateTime.now().minus({ day: 7 }).toJSDate();
      const countUsers = await this.usersRepository.count({
        where: {
          posted_need: false,
          created_at: LessThan(sevenDaysAgo),
          email: Not(IsNull()),
        },
        relations: {
          need_posts: true,
        },
      });
      const pageSize = 100;
      let index = 0;
      while (index < countUsers) {
        const users = await this.usersRepository.find({
          where: {
            posted_need: false,
            created_at: LessThan(sevenDaysAgo),
            email: Not(IsNull()),
          },
          select: { id: true },
          take: pageSize,
          skip: index,
          order: { created_at: 'ASC' },
        });
        index += pageSize;
        await this.userQueue.add(
          {
            task: '7_days_no_needs',
            extraData: { users: users },
          },
          {
            removeOnComplete: 100,
            removeOnFail: 1000,
          },
        );
      }
    });
  }

  async sendNoNeedsEmail(users: { id: string }[]) {
    for (const uid of users) {
      const user = await this.findOne(uid.id);
      if (!user) {
        continue;
      }
      if (await this.hasPostedNeed(user)) {
        //Mark users who have needs
        user.posted_need = true;
        this.usersRepository.save(user);
      } else {
        //Skip users who are still onboarding
        const profile = await this.getProfile(user);
        if ((profile?.onboardingStage ?? 0) < 4) {
          continue;
        }
        const credits = await this.creditsService.getUserCredits(user);
        if (credits > 0) {
          const lastUserNeedsEmail = await this.lastMailRepository.findOne({
            where: {
              user: { id: user.id },
              mailout: '7_days_no_needs',
            },
          });
          if (lastUserNeedsEmail) {
            continue;
          }
          this.mailService.scheduleMail(user, '7_days_no_needs', {
            credits: credits,
          });
          const messageSent = new LastMail();
          messageSent.last_mail = DateTime.now().toJSDate();
          messageSent.mailout = '7_days_no_needs';
          messageSent.user = user;
          this.lastMailRepository.save(messageSent);
        }
      }
    }
  }

  @Cron('0 */15 * * * *')
  async checkIfUserHasPortfolio() {
    await this.redlock.using(['3-day-no-portfolio'], 30000, async (signal) => {
      if (signal.aborted) {
        throw signal.error;
      }

      const threeDaysAgo = DateTime.now().minus({ day: 3 }).toJSDate();
      const countUsers = await this.usersRepository.count({
        where: {
          posted_portfolio: false,
          created_at: LessThan(threeDaysAgo),
          email: Not(IsNull()),
        },
      });
      const pageSize = 50;
      let index = 0;
      while (index < countUsers) {
        const users = await this.usersRepository.find({
          where: {
            posted_portfolio: false,
            created_at: LessThan(threeDaysAgo),
            email: Not(IsNull()),
          },
          select: { id: true },
          take: pageSize,
          skip: index,
          order: { created_at: 'ASC' },
        });
        index += pageSize;
        await this.userQueue.add(
          {
            task: '3_days_no_portfolio',
            extraData: { users: users },
          },
          {
            removeOnComplete: 100,
            removeOnFail: 1000,
          },
        );
      }
    });
  }

  async sendNoPortfolioEmail(users: { id: string }[]) {
    for (const uid of users) {
      const user = await this.findOne(uid.id);
      if (!user) {
        continue;
      }
      if (await this.hasPostedPortfolio(user)) {
        //Mark users who have portfolios
        user.posted_portfolio = true;
        this.usersRepository.save(user);
      } else {
        //Skip users who are still onboarding
        const profile = await this.getProfile(user);
        if ((profile?.onboardingStage ?? 0) < 4) {
          continue;
        }
        const lastUserPortfolioEmail = await this.lastMailRepository.findOne({
          where: {
            user: { id: user.id },
            mailout: '3_days_no_portfolio',
          },
        });
        if (lastUserPortfolioEmail) {
          continue;
        }
        this.mailService.scheduleMail(user, '3_days_no_portfolio');
        const messageSent = new LastMail();
        messageSent.last_mail = DateTime.now().toJSDate();
        messageSent.mailout = '3_days_no_portfolio';
        messageSent.user = user;
        this.lastMailRepository.save(messageSent);
      }
    }
  }
}
