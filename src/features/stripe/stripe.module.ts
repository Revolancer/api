import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeConfigModule } from 'src/config/stripe/config.module';
import { StripeUser } from './entities/stripeuser.entity';
import { StripeService } from './stripe.service';

@Module({
  imports: [StripeConfigModule, TypeOrmModule.forFeature([StripeUser])],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
