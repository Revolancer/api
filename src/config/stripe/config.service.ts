import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class StripeConfigService {
  constructor(private configService: ConfigService) {}

  get sk(): string | undefined {
    return this.configService.get<string>('stripe.sk');
  }
  get pk(): string | undefined {
    return this.configService.get<string>('stripe.pk');
  }
  get apiVersion(): string | undefined {
    return '2022-11-15';
  }
}
