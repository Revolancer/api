import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BullBoardController } from './bull-board.controller';
import { BullBoardService } from './bull-board.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'chargebee' }),
    BullModule.registerQueue({ name: 'mail' }),
  ],
  providers: [BullBoardService],
  controllers: [BullBoardController],
})
export class BullBoardModule {}
