import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';

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
    const payload = { sub: user.id };
    return {
      access_token: this.jwtService.sign(
        { purpose: 'authenticate', ...payload },
        { expiresIn: '15 minutes' },
      ),
      refresh_token: this.jwtService.sign(
        { purpose: 'refresh', ...payload },
        { expiresIn: '2 weeks' },
      ),
    };
  }

  async register(body: CreateUserDto) {
    return this.usersService.create(body.password, body.email);
  }
}
