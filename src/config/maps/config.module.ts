import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { MapsConfigService } from './config.service';
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
        MAPS_KEY: Joi.string().default(''),
      }),
    }),
  ],
  providers: [ConfigService, MapsConfigService],
  exports: [ConfigService, MapsConfigService],
})
export class MapsConfigModule {}
