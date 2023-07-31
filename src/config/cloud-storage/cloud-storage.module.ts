import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import configuration from './cloud-storage';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudStorageConfigService } from './cloud-storage.service';
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
        CLOUD_STORAGE_KEY: Joi.string().default('{}'),
      }),
    }),
  ],
  providers: [ConfigService, CloudStorageConfigService],
  exports: [ConfigService, CloudStorageConfigService],
})
export class CloudStorageConfigModule {}
