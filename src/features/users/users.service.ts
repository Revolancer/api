import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { DateTime } from 'luxon';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { License } from './entities/license.entity';
import { User } from './entities/user.entity';
import { UserConsent } from './entities/userconsent.entity';
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
    private stripeService: StripeService,
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
    this.addConsent(user, 'terms');
    if (marketingFirstParty) {
      this.addConsent(user, 'marketing-firstparty');
    }
    if (marketingThirdParty) {
      this.addConsent(user, 'marketing-thirdparty');
    }
    const trialEnd = DateTime.now().plus({ days: 30 }).toJSDate();
    await this.grantLicense(user, trialEnd);
    this.stripeService.linkToStripe(user);
    return user.id;
  }

  async addRole(user: User, role: string): Promise<void> {
    await this.userRolesRepository.upsert(
      {
        user: user,
        role: role,
      },
      ['user', 'role'],
    );
  }

  async addConsent(user: User, consentFor: string): Promise<void> {
    await this.userConsentRepository.insert({
      user: user,
      consent_for: consentFor,
    });
  }

  async hasValidLicense(user: User): Promise<boolean> {
    try {
      const license = await this.licenseRepository.findOneOrFail({
        relations: { user: true },
        where: {
          user: {
            id: user.id,
          },
        },
      });
      return license.expires_at > new Date();
    } catch (err) {
      return false;
    }
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
}
