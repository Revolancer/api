import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { AdminJob } from './admin.job';
import { AdminService } from '../admin.service';

@Processor('admin')
export class AdminConsumer {
  constructor(private adminService: AdminService) {}

  @Process({ concurrency: 1 })
  async process(job: Job<AdminJob>) {
    switch (job.data.task) {
      default:
        throw new Error(
          `Task ${job.data.task} does not have a registered handler`,
        );
    }
  }
}
