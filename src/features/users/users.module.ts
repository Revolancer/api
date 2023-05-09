import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthConfigModule } from 'src/config/auth/config.module';
import { AuthConfigService } from 'src/config/auth/config.service';
import { MailModule } from '../mail/mail.module';
import { MessageModule } from '../messages/message.module';
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
import { CreditsModule } from '../credits/credits.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    UploadModule,
    TagsModule,
    PortfolioModule,
    NeedModule,
    MessageModule,
    CreditsModule,
    ProjectsModule,
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
