import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BullBoardController } from './bull-board.controller';
import { BullBoardService } from './bull-board.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'admin' }),
    BullModule.registerQueue({ name: 'mail' }),
    BullModule.registerQueue({ name: 'user' }),
    BullModule.registerQueue({ name: 'index' }),
  ],
  providers: [BullBoardService],
  controllers: [BullBoardController],
})
export class BullBoardModule {}
