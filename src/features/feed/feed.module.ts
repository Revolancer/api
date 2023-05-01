import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NeedModule } from '../need/need.module';

@Module({
  imports: [PortfolioModule, NeedModule],
  providers: [FeedService],
  exports: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
