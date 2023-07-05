import { NestFactory, PartialGraphHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app/config.service';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: process.env.NODE_ENV !== 'production',
    abortOnError: process.env.NODE_ENV === 'production',
  });
  const appConfig: AppConfigService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');
  logger.log(`Listening on ${appConfig.port}`);
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? appConfig.cors_url : '*',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.use(compression());
  await app.listen(appConfig.port);
}
bootstrap().catch((err) => {
  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync('graph.json', PartialGraphHost.toString() ?? 'no graph');
    process.exit(1);
  }
  throw err;
});
