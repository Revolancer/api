import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class TurnstileConfigService {
  constructor(private configService: ConfigService) {}

  get secret(): string | undefined {
    return this.configService.get<string>('turnstile.secret');
  }
}
