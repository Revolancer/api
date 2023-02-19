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

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    HealthModule,
    MailModule,
    UsersModule,
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
  ],
})
export class AppModule {}
