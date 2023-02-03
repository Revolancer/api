import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { StripeQueueJob } from './stripe-queue-job';
import { StripeService } from './stripe.service';

@Processor('stripe')
export class StripeConsumer {
  constructor(private stripeService: StripeService) {}

  @Process()
  async process(job: Job<StripeQueueJob>) {
    switch (job.data.operation) {
      case 'link':
        return this.processLinkingJob(job);
      default:
        throw new Error(
          `Operation ${job.data.operation} does not have a registered handler`,
        );
    }
  }

  async processLinkingJob(job: Job<StripeQueueJob>) {
    await this.stripeService.findOrCreateStripeUser(job.data.user);
    await job.progress(100);
  }
}
