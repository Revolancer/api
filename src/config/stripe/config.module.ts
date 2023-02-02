import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { StripeConfigService } from './config.service';
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
        STRIPE_SK: Joi.string().default('testkey'),
        STRIPE_PK: Joi.string().default('testkey'),
      }),
    }),
  ],
  providers: [ConfigService, StripeConfigService],
  exports: [ConfigService, StripeConfigService],
})
export class StripeConfigModule {}
