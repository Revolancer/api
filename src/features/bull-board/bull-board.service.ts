import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { MailJob } from '../mail/queue/mail.job';
import { AdminJob } from '../admin/queue/admin.job';
import { UserJob } from '../users/queue/user.job';
import { IndexJob } from '../index/queue/index.job';

@Injectable()
export class BullBoardService {
  constructor(
    @InjectQueue('admin') private adminQueue: Queue<AdminJob>,
    @InjectQueue('mail') private mailQueue: Queue<MailJob>,
    @InjectQueue('user') private userQueue: Queue<UserJob>,
    @InjectQueue('index') private indexQueue: Queue<IndexJob>,
  ) {}

  getQueues(): Array<Queue> {
    return [this.adminQueue, this.mailQueue, this.userQueue, this.indexQueue];
  }
}
