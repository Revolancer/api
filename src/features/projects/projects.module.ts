import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMessage } from './entities/project-message.entity';
import { CreditsModule } from '../credits/credits.module';
import { NeedModule } from '../need/need.module';
import { UploadModule } from '../upload/upload.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { LastMail } from '../mail/entities/last-mail.entity';
import { RedlockModule } from '@anchan828/nest-redlock';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { RedisConfigService } from 'src/config/redis/config.service';
import { Redis } from 'ioredis';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMessage, LastMail]),
    MailModule,
    CreditsModule,
    NeedModule,
    UploadModule,
    forwardRef(() => UsersModule),
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
  providers: [ProjectsService],
  exports: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
