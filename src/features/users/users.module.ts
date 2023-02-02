import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './entities/license.entity';
import { User } from './entities/user.entity';
import { UserRole } from './entities/userrole.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, License])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
