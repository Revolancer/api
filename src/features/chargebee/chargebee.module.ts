import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargebeeUser } from './entities/chargebeeuser.entity';
import { ChargebeeService } from './chargebee.service';
import { ChargebeeConfigModule } from 'src/config/chargebee/config.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ChargebeeConfigModule,
    TypeOrmModule.forFeature([ChargebeeUser]),
    BullModule.registerQueue({ name: 'chargebee' }),
  ],
  providers: [ChargebeeService],
  exports: [ChargebeeService],
})
export class ChargebeeModule {}
