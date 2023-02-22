import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargebeeUser } from './entities/chargebeeuser.entity';
import { ChargebeeService } from './chargebee.service';
import { ChargebeeConfigModule } from 'src/config/chargebee/config.module';
import { BullModule } from '@nestjs/bull';
import { ChargebeeConsumer } from './queue/chargebee.consumer';
import { ChargebeeController } from './chargebee.controller';

@Module({
  imports: [
    ChargebeeConfigModule,
    TypeOrmModule.forFeature([ChargebeeUser]),
    BullModule.registerQueue({ name: 'chargebee' }),
  ],
  providers: [ChargebeeService, ChargebeeConsumer],
  exports: [ChargebeeService],
  controllers: [ChargebeeController],
})
export class ChargebeeModule {}
