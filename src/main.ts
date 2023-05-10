import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app/config.service';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig: AppConfigService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');
  logger.log(`Listening on ${appConfig.port}`);
  app.enableCors({
    origin: appConfig.cors_url,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.use(compression());
  await app.listen(appConfig.port);
}
bootstrap();
