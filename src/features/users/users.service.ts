import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { DateTime } from 'luxon';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { Repository } from 'typeorm';
import { License } from './entities/license.entity';
import { User } from './entities/user.entity';
import { UserRole } from './entities/userrole.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
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

  findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      relations: ['roles'],
      where: { email: email },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (user === null) {
      return;
    }
    await this.usersRepository.softRemove(user);
  }

  async create(password: string, email?: string): Promise<User> {
    const partial = this.usersRepository.create();
    if (typeof email !== 'undefined') {
      partial.email = email;
      if ((await this.findOneByEmail(email)) !== null) {
        throw new EmailExistsError();
      }
    }
    partial.password = await argon2.hash(password);
    const user = await this.usersRepository.save(partial);
    this.addRole(user, 'user');
    const trialEnd = DateTime.now().plus({ days: 30 }).toJSDate();
    this.grantLicense(user, trialEnd);
    return user;
  }

  async addRole(user: User, role: string): Promise<void> {
    if (typeof user.roles !== 'undefined') {
      user.roles.forEach((currentRole) => {
        if (currentRole.role == role) {
          return;
        }
      });
    }
    const newRole = this.userRolesRepository.create({
      user: user,
      role: role,
    });
    await this.userRolesRepository.save(newRole);
  }

  async hasValidLicense(user: User): Promise<boolean> {
    try {
      const license = await this.licenseRepository.findOneOrFail({
        where: { user: user },
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
