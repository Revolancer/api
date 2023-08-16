import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class MapsConfigService {
  constructor(private configService: ConfigService) {}

  get key(): string {
    return String(this.configService.get<string>('maps.key'));
  }
}
