import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { StripeJob } from './stripe.job';
import { StripeService } from '../stripe.service';

@Processor('stripe')
export class StripeConsumer {
  constructor(private stripeService: StripeService) {}

  @Process()
  async process(job: Job<StripeJob>) {
    switch (job.data.operation) {
      case 'link':
        return this.processLinkingJob(job);
      default:
        throw new Error(
          `Operation ${job.data.operation} does not have a registered handler`,
        );
    }
  }

  async processLinkingJob(job: Job<StripeJob>) {
    await this.stripeService.findOrCreateStripeUser(job.data.user);
    await job.progress(100);
  }
}
