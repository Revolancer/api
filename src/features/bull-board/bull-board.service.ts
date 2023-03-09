import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { MailJob } from '../mail/queue/mail.job';

@Injectable()
export class BullBoardService {
  constructor(@InjectQueue('mail') private mailQueue: Queue<MailJob>) {}

  getQueues(): Array<Queue> {
    return [this.mailQueue];
  }
}
