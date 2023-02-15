import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeModule } from '../stripe/stripe.module';
import { License } from './entities/license.entity';
import { User } from './entities/user.entity';
import { UserConsent } from './entities/userconsent.entity';
import { UserRole } from './entities/userrole.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    StripeModule,
    TypeOrmModule.forFeature([User, UserRole, UserConsent, License]),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
