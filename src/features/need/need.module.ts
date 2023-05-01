import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsModule } from '../tags/tags.module';
import { NeedPost } from './entities/need-post.entity';
import { NeedController } from './need.controller';
import { NeedService } from './need.service';

@Module({
  imports: [TypeOrmModule.forFeature([NeedPost]), TagsModule],
  providers: [NeedService],
  exports: [NeedService],
  controllers: [NeedController],
})
export class NeedModule {}
