import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { CreditsModule } from '../credits/credits.module';
import { MessageModule } from '../messages/message.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    CreditsModule,
    MessageModule,
    ProjectsModule,
  ],
  controllers: [CronController],
})
export class CronModule {}
