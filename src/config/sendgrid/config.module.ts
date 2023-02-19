import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { SendgridConfigService } from './config.service';
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
        SENDGRID_KEY: Joi.string().default('testkey'),
      }),
    }),
  ],
  providers: [ConfigService, SendgridConfigService],
  exports: [ConfigService, SendgridConfigService],
})
export class SendgridConfigModule {}
