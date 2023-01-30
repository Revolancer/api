import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class AuthConfigService {
  constructor(private configService: ConfigService) {}

  get jwtSecret(): string | undefined {
    return this.configService.get<string>('auth.jwtSecret');
  }
}
