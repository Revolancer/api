import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsModule } from '../tags/tags.module';
import { PortfolioPost } from './entities/portfolio-post.entity';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  imports: [TypeOrmModule.forFeature([PortfolioPost]), TagsModule],
  providers: [PortfolioService],
  exports: [PortfolioService],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
