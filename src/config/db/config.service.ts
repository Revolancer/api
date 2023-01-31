import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class DBConfigService {
  constructor(private configService: ConfigService) {}

  get host(): string | undefined {
    return this.configService.get<string>('db.host');
  }

  get port(): number {
    return Number(this.configService.get<number>('db.port'));
  }

  get user(): string | undefined {
    return this.configService.get<string>('db.user');
  }

  get password(): string | undefined {
    return this.configService.get<string>('db.password');
  }

  get db(): string | undefined {
    return this.configService.get<string>('db.db');
  }
}
