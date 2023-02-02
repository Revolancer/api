import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app/config.module';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBConfigModule } from './config/db/config.module';
import { DBConfigService } from './config/db/config.service';
import { HealthModule } from './features/health/health.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    UsersModule,
    HealthModule,
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
  ],
})
export class AppModule {}
