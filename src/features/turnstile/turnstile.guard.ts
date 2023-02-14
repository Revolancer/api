import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import axios from 'axios';
import { TurnstileConfigService } from 'src/config/turnstile/config.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private config: TurnstileConfigService) {}
  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request?.body?.turnstileResponse ?? '';

    return this.checkResponse(token);
  }

  async checkResponse(token: string): Promise<boolean> {
    const cfresponse = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: this.config.secret,
        response: token,
      },
    );
    return cfresponse?.data?.success === true;
  }
}
