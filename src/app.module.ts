import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBConfigModule } from './config/db/config.module';
import { DBConfigService } from './config/db/config.service';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
