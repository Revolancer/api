import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import Bugsnag from '@bugsnag/js';

@Catch()
export class ExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Bugsnag.start({
      apiKey: process.env.BUGSNAG_API_KEY ?? '',
      appVersion: '0.32.0',
      releaseStage: process.env.NODE_ENV,
    });
    if (exception instanceof HttpException) {
      if (exception.cause) {
        Bugsnag.notify(exception.cause);
      }
    } else {
      Bugsnag.notify(exception as Error);
    }
    super.catch(exception, host);
  }
}
