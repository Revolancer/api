import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsModule } from '../tags/tags.module';
import { User } from '../users/entities/user.entity';
import { Message } from './entities/message.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MailModule } from '../mail/mail.module';
import { LastMail } from '../mail/entities/last-mail.entity';
import { UsersModule } from '../users/users.module';
import { RedlockModule } from '@anchan828/nest-redlock';
import Redis from 'ioredis';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { RedisConfigService } from 'src/config/redis/config.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, LastMail]),
    TagsModule,
    UploadModule,
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
    forwardRef(() => MailModule),
    forwardRef(() => UsersModule),
  ],
  providers: [MessageService],
  exports: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
