import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/userprofile.entity';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { NeedPost } from '../need/entities/need-post.entity';
import { Proposal } from '../need/entities/proposal.entity';
import { UserReferrer } from '../users/entities/userreferrer.entity';
import { CreditsModule } from '../credits/credits.module';
import { UploadModule } from '../upload/upload.module';
import { BullModule } from '@nestjs/bull';
import { AdminConsumer } from './queue/admin.consumer';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Project } from '../projects/entities/project.entity';
import { StatsLog } from './entities/stats-log.entity';
import { RedlockModule } from '@anchan828/nest-redlock';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { RedisConfigService } from 'src/config/redis/config.service';
import { Redis } from 'ioredis';
import { UserRole } from '../users/entities/userrole.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { NeedModule } from '../need/need.module';
import { ProjectMessage } from '../projects/entities/project-message.entity';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserRole,
      PortfolioPost,
      NeedPost,
      Proposal,
      UserReferrer,
      Project,
      ProjectMessage,
      StatsLog,
      Tag,
    ]),
    CreditsModule,
    UploadModule,
    UsersModule,
    MailModule,
    NeedModule,
    PortfolioModule,
    BullModule.registerQueue({
      name: 'admin',
    }),
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
  ],
  providers: [AdminService, StatsService, AdminConsumer, TagsService],
  exports: [AdminService, StatsService],
  controllers: [AdminController, StatsController],
})
export class AdminModule {}
