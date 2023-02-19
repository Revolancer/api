import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailJob } from './mail.job';
import { MailService } from '../mail.service';

@Processor('mail')
export class MailConsumer {
  constructor(private mailService: MailService) {}

  @Process()
  async process(job: Job<MailJob>) {
    switch (job.data.mailout) {
      case 'verify_email':
        this.mailService.sendMailoutEmailVerify(job.data.user);
        break;
      case 'password_reset':
        this.mailService.sendMailoutPasswordReset(job.data.user);
        break;
      default:
        throw new Error(
          `Mailout ${job.data.mailout} does not have a registered handler`,
        );
    }
  }
}
