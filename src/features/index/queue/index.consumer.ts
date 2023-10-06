import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { IndexService } from '../index.service';
import { IndexJob } from './index.job';

@Processor('index')
export class IndexConsumer {
  private readonly logger = new Logger(IndexConsumer.name);
  constructor(private indexService: IndexService) {}

  @Process({ concurrency: 1 })
  async process(job: Job<IndexJob>) {
    switch (job.data.datatype) {
      case 'user':
        this.indexService.indexUsers(job.data.users!);
        break;
      case 'need':
        this.indexService.indexNeeds(job.data.needs!);
        break;
      case 'portfolio':
        this.indexService.indexPortfolios(job.data.portfolios!);
        break;
      default:
        throw new Error(
          `Index datatype ${job.data.datatype} does not have a registered handler`,
        );
    }
  }
}
