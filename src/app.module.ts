import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app/config.module';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBConfigModule } from './config/db/config.module';
import { DBConfigService } from './config/db/config.service';
import { HealthModule } from './features/health/health.module';
import { BullModule } from '@nestjs/bull';
import { RedisConfigModule } from './config/redis/config.module';
import { RedisConfigService } from './config/redis/config.service';
import { MailModule } from './features/mail/mail.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullBoardModule } from './features/bull-board/bull-board.module';
import { TagsModule } from './features/tags/tags.module';
import { UploadModule } from './features/upload/upload.module';
import { APP_FILTER } from '@nestjs/core';
import { ExceptionFilter } from './exception.filter';
import { FeedModule } from './features/feed/feed.module';

@Module({})
class NullModule {}

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    HealthModule,
    MailModule,
    UsersModule,
    TagsModule,
    UploadModule,
    FeedModule,
    process.env.NODE_ENV === 'production' ? NullModule : BullBoardModule, // Don't load bull-board in prod
    TypeOrmModule.forRootAsync({
      imports: [DBConfigModule],
      inject: [DBConfigService],
      useFactory: async (dbConfig: DBConfigService) => ({
        type: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.db,
        autoLoadEntities: true,
        synchronize: dbConfig.synchronise,
      }),
    }),
    BullModule.forRootAsync({
      imports: [RedisConfigModule],
      inject: [RedisConfigService],
      useFactory: async (redisConfig: RedisConfigService) => ({
        redis: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
      }),
    }),
    ThrottlerModule.forRoot({
      ttl: 30,
      limit: 5,
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
})
export class AppModule {}
