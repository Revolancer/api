import { Module } from '@nestjs/common';
import { TurnstileConfigModule } from 'src/config/turnstile/config.module';
import { TurnstileGuard } from './turnstile.guard';

@Module({
  imports: [TurnstileConfigModule],
  providers: [TurnstileGuard],
  exports: [TurnstileConfigModule],
})
export class TurnstileModule {}
