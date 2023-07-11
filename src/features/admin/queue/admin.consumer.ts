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
      case 'import_users':
        return await this.adminService.runUserImport(
          job.data.user,
          job.data.extraData,
        );
      case 'import_single_user':
        return await this.adminService.runSingleUserImport(
          job.data.user,
          job.data.extraData,
        );
      default:
        throw new Error(
          `Task ${job.data.task} does not have a registered handler`,
        );
    }
  }
}
