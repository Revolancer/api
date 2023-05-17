import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/userprofile.entity';
import { DateTime } from 'luxon';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  countUsers() {
    return this.userRepository.count();
  }

  countDau() {
    const yesterday = DateTime.now().minus({ day: 1 }).toJSDate();
    return this.userProfileRepository.count({
      where: { last_active: MoreThanOrEqual(yesterday) },
    });
  }

  countMau() {
    const lastMonth = DateTime.now().minus({ day: 28 }).toJSDate();
    return this.userProfileRepository.count({
      where: { last_active: MoreThanOrEqual(lastMonth) },
    });
  }
}
