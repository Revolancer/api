import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { SendgridConfigModule } from 'src/config/sendgrid/config.module';
import { UsersModule } from '../users/users.module';
import { MailConsumer } from './queue/mail.consumer';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LastMail } from './entities/last-mail.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    SendgridConfigModule,
    BullModule.registerQueue({ name: 'mail' }),
    TypeOrmModule.forFeature([LastMail]),
  ],
  providers: [MailService, MailConsumer],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
