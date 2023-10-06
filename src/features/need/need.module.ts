import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsModule } from '../tags/tags.module';
import { NeedPost } from './entities/need-post.entity';
import { NeedController } from './need.controller';
import { NeedService } from './need.service';
import { Proposal } from './entities/proposal.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IndexModule } from '../index/index.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NeedPost, Proposal]),
    TagsModule,
    MailModule,
    NotificationsModule,
    IndexModule,
  ],
  providers: [NeedService],
  exports: [NeedService],
  controllers: [NeedController],
})
export class NeedModule {}
