import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailJob } from './mail.job';
import { MailService } from '../mail.service';
import { Logger } from '@nestjs/common';

@Processor('mail')
export class MailConsumer {
  private readonly logger = new Logger(MailConsumer.name);
  constructor(private mailService: MailService) {}

  @Process()
  async process(job: Job<MailJob>) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `Would send ${job.data.mailout} to ${job.data.user.email}`,
      );
      return;
    }
    switch (job.data.mailout) {
      case 'admin_import_summary':
        this.mailService.sendMailoutAccountImportSummary(
          job.data.user,
          job.data.extraData,
        );
        break;
      case 'account_import':
        this.mailService.sendMailoutAccountImport(job.data.user);
        break;
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
