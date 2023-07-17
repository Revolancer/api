import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { UserJob } from './user.job';
import { Logger } from '@nestjs/common';
import { UsersService } from '../users.service';

@Processor('user')
export class UserConsumer {
  private readonly logger = new Logger(UserConsumer.name);
  constructor(private usersService: UsersService) {}

  @Process({ concurrency: 1 })
  async process(job: Job<UserJob>) {
    switch (job.data.task) {
      case '7_days_no_needs':
        this.usersService.sendNoNeedsEmail(job.data.extraData.users);
        break;
      case '3_days_no_portfolio':
        this.usersService.sendNoPortfolioEmail(job.data.extraData.users);
        break;
      default:
        throw new Error(
          `Task ${job.data.task} does not have a registered handler`,
        );
    }
  }
}
