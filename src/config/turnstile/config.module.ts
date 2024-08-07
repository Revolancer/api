import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { TurnstileConfigService } from './config.service';
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
        CF_TURNSTILE_PRIVATEKEY: Joi.string().default(
          '1x0000000000000000000000000000000AA',
        ),
      }),
    }),
  ],
  providers: [ConfigService, TurnstileConfigService],
  exports: [ConfigService, TurnstileConfigService],
})
export class TurnstileConfigModule {}
