import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeConfigModule } from 'src/config/stripe/config.module';
import { StripeUser } from './entities/stripeuser.entity';
import { StripeConsumer } from './stripe.consumer';
import { StripeService } from './stripe.service';

@Module({
  imports: [
    StripeConfigModule,
    TypeOrmModule.forFeature([StripeUser]),
    BullModule.registerQueue({ name: 'stripe' }),
  ],
  providers: [StripeService, StripeConsumer],
  exports: [StripeService],
})
export class StripeModule {}
