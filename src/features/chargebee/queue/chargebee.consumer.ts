import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ChargebeeJob } from './chargebee.job';
import { ChargebeeService } from '../chargebee.service';

@Processor('chargebee')
export class ChargebeeConsumer {
  constructor(private chargebeeService: ChargebeeService) {}

  @Process()
  async process(job: Job<ChargebeeJob>) {
    switch (job.data.task) {
      case 'link_user':
        this.chargebeeService.linkToRemote(job.data.user);
        break;
      default:
        throw new Error(
          `Chargebee task ${job.data.task} does not have a registered handler`,
        );
    }
  }
}
