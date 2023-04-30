import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [PortfolioModule],
  providers: [FeedService],
  exports: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
