import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { MailJob } from '../mail/queue/mail.job';
import { AdminJob } from '../admin/queue/admin.job';

@Injectable()
export class BullBoardService {
  constructor(
    @InjectQueue('admin') private adminQueue: Queue<AdminJob>,
    @InjectQueue('mail') private mailQueue: Queue<MailJob>,
  ) {}

  getQueues(): Array<Queue> {
    return [this.adminQueue, this.mailQueue];
  }
}
