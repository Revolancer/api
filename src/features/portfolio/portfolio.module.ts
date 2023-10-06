import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsModule } from '../tags/tags.module';
import { PortfolioPost } from './entities/portfolio-post.entity';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { IndexModule } from '../index/index.module';

@Module({
  imports: [TypeOrmModule.forFeature([PortfolioPost]), TagsModule, IndexModule],
  providers: [PortfolioService],
  exports: [PortfolioService],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
