import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { DBConfigService } from './config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
/**
 * Import and provide app configuration related classes.
 *
 * @module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: Joi.object({
        DB_POSTGRES_USER: Joi.string().default('postgres'),
        DB_POSTGRES_PASS: Joi.string().default('postgres'),
        DB_POSTGRES_HOST: Joi.string().default('localhost'),
        DB_POSTGRES_PORT: Joi.number().default(5432),
        DB_POSTGRES_DB: Joi.string().default('postgres'),
        DB_POSTGRES_SYNC: Joi.boolean().default(true),
      }),
    }),
  ],
  providers: [ConfigService, DBConfigService],
  exports: [ConfigService, DBConfigService],
})
export class DBConfigModule {}
