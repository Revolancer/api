import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NeedModule } from '../need/need.module';
import { SearchModule } from '../search/search.module';
import { UserProfile } from '../users/entities/userprofile.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../users/entities/userrole.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    PortfolioModule,
    NeedModule,
    SearchModule,
    TypeOrmModule.forFeature([UserProfile, UserRole, User]),
  ],
  providers: [FeedService],
  exports: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
