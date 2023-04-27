import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class BugsnagConfigService {
  constructor(private configService: ConfigService) {}

  get key(): string | undefined {
    return this.configService.get<string>('bugsnag.key');
  }

  get releaseStage(): number {
    return Number(this.configService.get<number>('bugsnag.releaseStage'));
  }
}
