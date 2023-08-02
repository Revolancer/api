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
    const users = DataFactory.createForClass(User).generate(500);

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
    const consent = new UserConsent();
    consent.consent_for = 'terms';
    consent.user = persistedAdmin;
    this.userConsentRepository.save(consent);

    //Add profile
    const profile = new UserProfile();
    profile.first_name = 'Revolancer';
    profile.last_name = 'Admin';
    profile.slug = 'admin';
    profile.profile_image =
      'https://app.revolancer.com/img/user/avatar-placeholder.png';
    profile.user = persistedAdmin;
    this.userProfileRepository.save(profile);

    return;
  }

  async drop(): Promise<any> {
    //const qb = this.usersRepository.createQueryBuilder();
    return; // qb.delete().from(User, 'user').execute();
  }
}
