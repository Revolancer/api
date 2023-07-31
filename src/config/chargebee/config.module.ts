import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { ChargebeeConfigService } from './config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
/**
 * Import and provide app configuration related classes.
 *
 * @module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.development'],
      load: [configuration],
      validationSchema: Joi.object({
        CHARGEBEE_KEY: Joi.string().default('testkey'),
        CHARGEBEE_SITE: Joi.string().default('revolancer-test'),
      }),
    }),
  ],
  providers: [ConfigService, ChargebeeConfigService],
  exports: [ConfigService, ChargebeeConfigService],
})
export class ChargebeeConfigModule {}
