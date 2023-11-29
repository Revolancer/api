import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
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
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { BullBoardModule } from './features/bull-board/bull-board.module';
import { TagsModule } from './features/tags/tags.module';
import { UploadModule } from './features/upload/upload.module';
import { APP_FILTER } from '@nestjs/core';
import { ExceptionFilter } from './exception.filter';
import { FeedModule } from './features/feed/feed.module';
import { AdminModule } from './features/admin/admin.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-yet';
import { IndexModule } from './features/index/index.module';
import { SearchModule } from './features/search/search.module';
import { CronModule } from './features/cron/cron.module';

@Module({})
class NullModule {}

@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [RedisConfigModule],
      useFactory: async (config: RedisConfigService) => ({
        store: await redisStore({
          url: `redis://${config.host}:${config.port}`,
        }),
      }),
      inject: [RedisConfigService],
    }),
    AppConfigModule,
    AuthModule,
    HealthModule,
    AdminModule,
    MailModule,
    UsersModule,
    TagsModule,
    UploadModule,
    FeedModule,
    IndexModule,
    SearchModule,
    process.env.NODE_ENV == 'development' ? BullBoardModule : NullModule, // Don't load bull-board in prod
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
    ThrottlerModule.forRoot([
      {
        ttl: seconds(30),
        limit: 5,
      },
    ]),
    DevtoolsModule.register({
      http: process.env.NODE_ENV == 'development',
    }),
    CronModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
})
export class AppModule {}
