import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeConfigModule } from 'src/config/stripe/config.module';
import { UsersModule } from '../users/users.module';
import { StripeUser } from './entities/stripeuser.entity';
import { StripeConsumer } from './queue/stripe.consumer';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [
    StripeConfigModule,
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([StripeUser]),
    BullModule.registerQueue({ name: 'stripe' }),
  ],
  providers: [StripeService, StripeConsumer],
  exports: [StripeService],
  controllers: [StripeController],
})
export class StripeModule {}
