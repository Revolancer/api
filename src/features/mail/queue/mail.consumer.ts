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
      case 'password_reset':
        this.mailService.sendMailoutPasswordReset(job.data.user);
        break;
      case 'account_delete':
        this.mailService.sendMailoutAccountDeleted(job.data.user);
        break;
      case 'email_change':
        this.mailService.sendMailoutEmailChanged(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'project_requested':
        this.mailService.sendMailoutProjectRequested(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'proposal_accepted':
        this.mailService.sendMailoutProposalAccepted(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'unread_messages':
        this.mailService.sendMailoutUnreadMessages(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'recent_needs':
        this.mailService.sendMailoutRecentNeeds(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'recent_portfolios':
        this.mailService.sendMailoutRecentPortfolios(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'email_confirm':
        this.mailService.sendMailoutEmailConfirm(job.data.user);
        break;
      case 'welcome':
        this.mailService.sendMailoutWelcome(job.data.user, job.data.extraData);
        break;
      case 'account_banned':
        this.mailService.sendMailoutAccountBanned(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'proposal_new':
        this.mailService.sendMailoutProposalNew(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'project_complete_client':
        this.mailService.sendMailoutProjectCompleteClient(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'project_complete_contractor':
        this.mailService.sendMailoutProjectCompleteContractor(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'project_unread_messages':
        this.mailService.sendMailoutProjectUnreadMessages(
          job.data.user,
          job.data.extraData,
        );
        break;
      default:
        throw new Error(
          `Mailout ${job.data.mailout} does not have a registered handler`,
        );
    }
  }
}
