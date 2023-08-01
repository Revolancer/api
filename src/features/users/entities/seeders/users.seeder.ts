import { Injectable } from '@nestjs/common';
import { DataFactory, Seeder } from 'nestjs-seeder';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../userprofile.entity';
import { UserConsent } from '../userconsent.entity';

@Injectable()
export class UsersSeeder implements Seeder {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserConsent)
    private userConsentRepository: Repository<UserConsent>,
  ) {}

  async seed(): Promise<any> {
    const users = DataFactory.createForClass(User).generate(5);

    for (const u of users) {
      const user = <User>(<unknown>u);
      const profile = <UserProfile>(
        (<unknown>DataFactory.createForClass(UserProfile).generate(1)[0])
      );
      const persistedUser = await this.usersRepository.save(user);
      const consent = new UserConsent();
      consent.consent_for = 'terms';
      consent.user = persistedUser;
      this.userConsentRepository.save(consent);

      profile.user = persistedUser;

      this.userProfileRepository.save(profile);
    }

    return;
  }

  async drop(): Promise<any> {
    //const qb = this.usersRepository.createQueryBuilder();
    return; // qb.delete().from(User, 'user').execute();
  }
}
