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

  get sk(): string {
    return String(this.configService.get<string>('stripe.sk'));
  }
  get pk(): string {
    return String(this.configService.get<string>('stripe.pk'));
  }
}
