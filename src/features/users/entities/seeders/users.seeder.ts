import { Injectable } from '@nestjs/common';
import { DataFactory, Seeder } from 'nestjs-seeder';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../userprofile.entity';
import { UserConsent } from '../userconsent.entity';
import * as argon2 from 'argon2';
import { UserRole } from '../userrole.entity';

@Injectable()
export class UsersSeeder implements Seeder {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserConsent)
    private userConsentRepository: Repository<UserConsent>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async seed(): Promise<any> {
    if ((await this.usersRepository.count()) > 0) {
      return;
    }
    const users = DataFactory.createForClass(User).generate(500);

    for (const u of users) {
      const user = <User>(<unknown>u);
      const profile = <UserProfile>(
        (<unknown>DataFactory.createForClass(UserProfile).generate(1)[0])
      );
      const persistedUser = await this.usersRepository.save(user);

      //Add terms consent
      await this.userConsentRepository.insert({
        user: { id: persistedUser.id },
        consent_for: 'terms',
      });

      profile.user = <any>{ id: persistedUser.id };

      this.userProfileRepository.save(profile);

      //Add user role
      await this.userRoleRepository.upsert(
        {
          user: { id: persistedUser.id },
          role: 'user',
        },
        ['user', 'role'],
      );
    }

    //Setup admin account

    const admin = new User();
    admin.email = 'admin@revolancer.com';
    admin.password = await argon2.hash('Password1!');
    const persistedAdmin = await this.usersRepository.save(admin);

    //Add user role
    await this.userRoleRepository.upsert(
      {
        user: { id: persistedAdmin.id },
        role: 'user',
      },
      ['user', 'role'],
    );

    //Add admin role
    await this.userRoleRepository.upsert(
      {
        user: { id: persistedAdmin.id },
        role: 'admin',
      },
      ['user', 'role'],
    );

    //Add terms consent
    await this.userConsentRepository.insert({
      user: { id: persistedAdmin.id },
      consent_for: 'terms',
    });

    //Add profile
    const adminProfile = <UserProfile>(
      (<unknown>DataFactory.createForClass(UserProfile).generate(1)[0])
    );
    await this.userProfileRepository.upsert(
      {
        ...adminProfile,
        user: { id: persistedAdmin.id },
        first_name: 'Revolancer',
        last_name: 'Admin',
        slug: 'admin',
        profile_image:
          'https://app.revolancer.com/img/user/avatar-placeholder.png',
      },
      ['user'],
    );

    return;
  }

  async drop(): Promise<any> {
    //const qb = this.usersRepository.createQueryBuilder();
    return; // qb.delete().from(User, 'user').execute();
  }
}
