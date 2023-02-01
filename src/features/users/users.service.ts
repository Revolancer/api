import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { EmailExistsError } from 'src/errors/email-exists-error';
import { NoUserError } from 'src/errors/no-user-error';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './userrole.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
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
}
