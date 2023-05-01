import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthConfigModule } from 'src/config/auth/config.module';
import { AuthConfigService } from 'src/config/auth/config.service';
//import { ChargebeeModule } from '../chargebee/chargebee.module';
import { MailModule } from '../mail/mail.module';
import { NeedModule } from '../need/need.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { TagsModule } from '../tags/tags.module';
import { UploadModule } from '../upload/upload.module';
import { User } from './entities/user.entity';
import { UserConsent } from './entities/userconsent.entity';
import { UserProfile } from './entities/userprofile.entity';
import { UserRole } from './entities/userrole.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    //ChargebeeModule, Removed monetisation for now
    UploadModule,
    TagsModule,
    PortfolioModule,
    NeedModule,
    forwardRef(() => MailModule),
    TypeOrmModule.forFeature([User, UserRole, UserConsent, UserProfile]),
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
  controllers: [UsersController],
})
export class UsersModule {}
