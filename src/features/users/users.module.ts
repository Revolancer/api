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
import { UserReferrer } from './entities/userreferrer.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { LastMail } from '../mail/entities/last-mail.entity';
import { RedlockModule } from '@anchan828/nest-redlock';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { RedisConfigService } from 'src/config/redis/config.service';
import { Redis } from 'ioredis';
import { NeedPost } from '../need/entities/need-post.entity';
import { BullModule } from '@nestjs/bull';
import { UserConsumer } from './queue/user.consumer';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { MapsModule } from '../maps/maps.module';
import { UserSocials } from './entities/usersocials.entity';

@Module({
  imports: [
    UploadModule,
    TagsModule,
    PortfolioModule,
    NeedModule,
    MessageModule,
    CreditsModule,
    ProjectsModule,
    NotificationsModule,
    MapsModule,
    forwardRef(() => MailModule),
    RedlockModule.registerAsync({
      imports: [RedisConfigModule],
      inject: [RedisConfigService],
      useFactory: async (redisConfig: RedisConfigService) => ({
        clients: [
          new Redis({
            host: redisConfig.host,
            port: redisConfig.port,
          }),
        ],
        settings: {
          driftFactor: 0.01,
          retryCount: 10,
          retryDelay: 200,
          retryJitter: 200,
          automaticExtensionThreshold: 500,
        },
        duration: 1000,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      UserRole,
      UserConsent,
      UserProfile,
      UserReferrer,
      LastMail,
      NeedPost,
      PortfolioPost,
      UserSocials,
    ]),
    JwtModule.registerAsync({
      imports: [AuthConfigModule],
      inject: [AuthConfigService],
      useFactory: async (authConfig: AuthConfigService) => ({
        secret: authConfig.jwtSecret,
      }),
    }),
    BullModule.registerQueue({ name: 'user' }),
  ],
  providers: [UsersService, UserConsumer],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
