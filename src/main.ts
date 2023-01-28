import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app/config.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig: AppConfigService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');
  logger.log(`Listening on ${appConfig.port}`);
  await app.listen(appConfig.port);
}
bootstrap();
