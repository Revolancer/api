import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthConfigService } from 'src/config/auth/config.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy) {
  constructor(authConfig: AuthConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtSecret,
    });
  }

  async validate(payload: any) {
    if (payload.purpose != 'refresh') {
      return false;
    }
    return { id: payload.sub };
  }
}
