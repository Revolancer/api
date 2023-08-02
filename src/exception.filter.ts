import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import Bugsnag from '@bugsnag/js';

@Catch()
export class ExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let shortcut = false;
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status < 500) {
        shortcut = true;
      }
    }
    if (!shortcut && process.env.NODE_ENV == 'production') {
      Bugsnag.start({
        apiKey: process.env.BUGSNAG_API_KEY ?? '',
        appVersion: '0.32.0',
        releaseStage: process.env.NODE_ENV,
      });
      if (exception instanceof HttpException) {
        if (exception.message) {
          Bugsnag.notify(exception.message);
        }
      } else {
        Bugsnag.notify(exception as Error);
      }
    }
    super.catch(exception, host);
  }
}
