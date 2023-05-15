import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { NoUserError } from 'src/errors/no-user-error';
import { UserRole } from '../users/entities/userrole.entity';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await argon2.verify(user.password, pass))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const loaded = await this.usersService.findOne(user.id);
    if (loaded === null) {
      throw new NoUserError();
    }

    const roles: string[] = [];

    loaded.roles.forEach((role: UserRole) => {
      roles.push(role.role);
    });

    const profile = await this.usersService.getProfile(loaded);
    this.usersService.markActive(loaded);

    //const license = await this.usersService.getSubscriptionStatus(loaded);

    const payload = {
      sub: loaded.id,
      /*license: license,*/ roles: roles,
    };
    return {
      accessToken: this.jwtService.sign(
        { purpose: 'authenticate', ...payload },
        { expiresIn: '15 minutes' },
      ),
      refreshToken: this.jwtService.sign(
        { purpose: 'refresh', ...payload },
        { expiresIn: '2 weeks' },
      ),
      email: loaded.email,
      roles: roles,
      onboardingStage: profile.onboardingStage ?? 1,
      id: loaded.id,
      //license: license,
    };
  }

  async refresh(user: any) {
    return await this.login(user);
  }

  async register(body: CreateUserDto) {
    return await this.usersService.create(
      body.password,
      body.email,
      body.marketingfirstparty,
      body.marketingthirdparty,
      body.referrer,
    );
  }

  async sendResetPassword(body: SendResetPasswordDto) {
    return await this.usersService.sendResetPassword(body.email);
  }
}
