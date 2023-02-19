import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthConfigModule } from 'src/config/auth/config.module';
import { AuthConfigService } from 'src/config/auth/config.service';
import { MailModule } from '../mail/mail.module';
import { License } from './entities/license.entity';
import { User } from './entities/user.entity';
import { UserConsent } from './entities/userconsent.entity';
import { UserRole } from './entities/userrole.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    forwardRef(() => MailModule),
    TypeOrmModule.forFeature([User, UserRole, UserConsent, License]),
    JwtModule.registerAsync({
      imports: [AuthConfigModule],
      inject: [AuthConfigService],
      useFactory: async (authConfig: AuthConfigService) => ({
        secret: authConfig.jwtSecret,
      }),
    }),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
