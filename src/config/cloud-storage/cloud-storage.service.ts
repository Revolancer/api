import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class CloudStorageConfigService {
  constructor(private configService: ConfigService) {}

  get key(): string {
    return String(this.configService.get<string>('cloud-storage.key'));
  }
}
