import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { ChargebeeJob } from '../chargebee/queue/chargebee.job';
import { MailJob } from '../mail/queue/mail.job';

@Injectable()
export class BullBoardService {
  constructor(
    @InjectQueue('mail') private mailQueue: Queue<MailJob>,
    @InjectQueue('chargebee')
    private chargebeeQueue: Queue<ChargebeeJob>,
  ) {}

  getQueues(): Array<Queue> {
    return [this.mailQueue, this.chargebeeQueue];
  }
}
