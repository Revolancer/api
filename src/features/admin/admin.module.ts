import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/userprofile.entity';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { NeedPost } from '../need/entities/need-post.entity';
import { Proposal } from '../need/entities/proposal.entity';
import { UserReferrer } from '../users/entities/userreferrer.entity';
import { CreditsModule } from '../credits/credits.module';
import { UploadModule } from '../upload/upload.module';
import { BullModule } from '@nestjs/bull';
import { AdminConsumer } from './queue/admin.consumer';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      PortfolioPost,
      NeedPost,
      Proposal,
      UserReferrer,
    ]),
    CreditsModule,
    UploadModule,
    UsersModule,
    MailModule,
    BullModule.registerQueue({
      name: 'admin',
    }),
  ],
  providers: [AdminService, AdminConsumer],
  exports: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
