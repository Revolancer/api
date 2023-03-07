import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Subscription } from 'chargebee-typescript/lib/resources';
import { DateTime } from 'luxon';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { Not, Repository } from 'typeorm';
import { ChargebeeService } from '../chargebee/chargebee.service';
import { MailService } from '../mail/mail.service';
import { Onboarding1Dto } from './dto/onboarding1.dto';
import { License } from './entities/license.entity';
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
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => MailService))
    private mailService: MailService,
    private chargebeeService: ChargebeeService,
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
    const trialEnd = DateTime.now().plus({ days: 30 }).toJSDate();
    await this.grantLicense(user, trialEnd);
    //Link to chargebee
    this.chargebeeService.queueLink(user);
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
    await this.userRolesRepository.upsert(
      {
        user: { id: user.id },
      },
      ['user'],
    );
  }

  async addConsent(user: User, consentFor: string): Promise<void> {
    await this.userConsentRepository.insert({
      user: user,
      consent_for: consentFor,
    });
  }

  async getLicenseExpiry(user: User): Promise<void | Date> {
    try {
      const license = await this.licenseRepository.findOneOrFail({
        relations: { user: true },
        where: {
          user: {
            id: user.id,
          },
        },
      });
      return license.expires_at;
    } catch (err) {
      return;
    }
  }

  async hasValidLicense(user: User): Promise<boolean> {
    const expiry = await this.getLicenseExpiry(user);
    return !!expiry && expiry > new Date();
  }

  async grantLicense(user: User, expiry: Date): Promise<void> {
    await this.licenseRepository.upsert({ user: user, expires_at: expiry }, [
      'user',
    ]);
  }

  async revokeLicense(user: User): Promise<void> {
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
    await this.licenseRepository.upsert({ user: user, expires_at: yesterday }, [
      'user',
    ]);
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

  async getSubscriptionStatus(user: User) {
    const subscription = {
      active: false, // is currently active?
      type: 'none', // one of ['none', 'intro', 'paid', 'bulk']
      source: 'none', // currently unused - for bulk licensing source
      expires: 0, // timestamp of expiry
    };

    const currentDate = new Date();
    const currentTime = currentDate.getTime();

    const customer = await this.chargebeeService.findOneByUser(user);
    let sub: void | Subscription;
    if (customer != null) {
      sub = await this.chargebeeService.getSubscription(customer);
      if (sub) {
        subscription.type = 'paid';
        subscription.expires = sub.current_term_end ?? 0;
      }
    }
    if (!sub) {
      const expiry = Math.floor(
        ((await this.getLicenseExpiry(user))?.getTime() ?? 0) / 1000,
      );
      subscription.type = 'intro';
      subscription.expires = expiry;
    }
    subscription.active = subscription.expires * 1000 > currentTime;
    return subscription;
  }

  async setFirstName(user: User, name: string) {
    this.userProfileRepository.upsert(
      {
        user: {
          id: user.id,
        },
        first_name: name,
      },
      ['user'],
    );
  }

  async doOnboardingStage1(user: User, body: Onboarding1Dto) {
    if (await this.checkUsernameAvailability(user, body.userName)) {
      this.userProfileRepository.upsert(
        {
          user: {
            id: user.id,
          },
          first_name: body.firstName,
          last_name: body.lastName,
          slug: body.userName,
          date_of_birth: body.dateOfBirth,
        },
        ['user'],
      );
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
    const blacklist = ['admin', 'revolancer', 'null'];
    for (const i in blacklist) {
      const word = blacklist[i];
      console.log(username, word, username.includes(word));
      if (username.includes(word)) {
        console.log('found you');
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
}
