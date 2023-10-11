import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ContentIndex } from '../index/entities/contentindex.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ContentIndex])],
  providers: [SearchService],
  exports: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
