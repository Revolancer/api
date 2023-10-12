import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NeedModule } from '../need/need.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [PortfolioModule, NeedModule, SearchModule],
  providers: [FeedService],
  exports: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
