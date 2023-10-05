import { Module } from '@nestjs/common';
import { IndexService } from './index.service';
import { ContentIndex } from './entities/contentindex.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContentIndex]), UsersModule],
  providers: [IndexService],
})
export class IndexModule {}
