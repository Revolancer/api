import { InjectQueue } from '@nestjs/bull';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { SendgridConfigService } from 'src/config/sendgrid/config.service';
import { User } from '../users/entities/user.entity';
import { MailJob } from './queue/mail.job';
import { MailDataRequired, MailService as Sendgrid } from '@sendgrid/mail';
import { UsersService } from '../users/users.service';
import { Mailout } from './mailout.type';
import { InjectRepository } from '@nestjs/typeorm';
import { LastMail } from './entities/last-mail.entity';
import { Repository } from 'typeorm';
import { NeedPost } from '../need/entities/need-post.entity';
import { Proposal } from '../need/entities/proposal.entity';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class MailService {
  private sendgrid: Sendgrid;
  private readonly logger = new Logger(MailService.name);

  private dynamicTemplateData = {
    manage_email_preferences_link: 'https://app.revolancer.com/settings/email',
    revolancer_logo_link: 'https://revolancer.com/',
    contact_support_link: 'https://support.revolancer.com',
    instagram_link: 'https://www.instagram.com/revolancer/',
    facebook_link: 'https://www.facebook.com/revolancercom',
    twitter_link: 'https://twitter.com/revolancercom',
    linkedin_link: 'https://www.linkedin.com/company/revolancer/',
    tiktok_link: 'https://www.tiktok.com/@revolancer',
  };

  private sender = 'Revolancer <noreply@revolancer.org>';
  private replyTo = 'support@revolancer.com';

  constructor(
    private config: SendgridConfigService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @InjectQueue('mail') private mailQueue: Queue<MailJob>,
    @InjectRepository(LastMail)
    private lastMailRepository: Repository<LastMail>,
  ) {
    this.sendgrid = new Sendgrid();
    this.sendgrid.setApiKey(config.key);
  }

  async getRecipientProfileVariables(user: User) {
    const profile = await this.usersService.getProfile(user);
    return {
      first_name: profile.first_name,
      last_name: profile.last_name,
    };
  }

  /**
   * Use this method to queue an email
   * Avoids doing expensive API calls before returning account details to new user
   * @param user The user to link
   */
  async scheduleMail(
    user: User,
    mailout: Mailout,
    extraData: { [key: string]: any } = {},
  ): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Schedule ${mailout} to ${user.email}`);
      return;
    }
    await this.mailQueue.add(
      {
        user: { ...user, password: '' },
        mailout,
        extraData,
      },
      {
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );
  }

  async sendMailoutEmailConfirm(user: User) {
    if (!user.email) return;
    const verifyKey = await this.usersService.getEmailVerifyToken(user);
    const mail = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-c37efcdb0609409bbc3cbe54058c87dc',
      dynamicTemplateData: {
        verify_url: `https://app.revolancer.com/verify-email?key=${verifyKey}`,
        ...this.dynamicTemplateData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutPasswordReset(user: User) {
    if (!user.email) return;
    const verifyKey = await this.usersService.getPasswordResetToken(user);
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-62c158e4f7d74dd68857a383b902fade',
      dynamicTemplateData: {
        reset_password: `https://app.revolancer.com/reset-password/${verifyKey}`,
        ...this.dynamicTemplateData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutAccountDeleted(user: User) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-ed2af3b3201d4c8192d1415fb891bd05',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutEmailChanged(user: User, extraData: { [key: string]: any }) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-68cb39ffbb78401482151110f054433c',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        new_email_address: user.email,
      },
    };
    this.sendgrid.send(mail);
    const mail2: MailDataRequired = {
      to: extraData.old_email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-68cb39ffbb78401482151110f054433c',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        new_email_address: user.email,
      },
    };
    this.sendgrid.send(mail2);
  }

  async sendMailoutProjectRequested(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-46ed9b1b9c1d43a78f12e8d4fc1ff084',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProposalNew(user: User, extraData: { [key: string]: any }) {
    if (!user.email) return;
    const need: NeedPost = extraData.need;
    const proposal: Proposal = extraData.proposal;
    const someone: User = extraData.someone;
    const profile = await this.usersService.getProfile(someone);

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-7c88be4ed0b24ba0aba2aea9071f5156',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        someone_profile_picture: profile.profile_image ?? '',
        someone_name: profile.first_name,
        your_need: {
          link: `https://app.revolancer.com/n/${need.id}`,
          title: need.title ?? '',
        },
        someone_proposal: {
          body: proposal.message,
          link: `https://app.revolancer.com/n/${need.id}`,
        },
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProposalAccepted(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const need: NeedPost = extraData.need;
    const project: Project = extraData.project;
    const someone: User = extraData.someone;
    const profile = await this.usersService.getProfile(someone);

    let summary = '';

    if (need.data) {
      try {
        const parsedBody = JSON.parse(need.data);
        const maxLength = 200;
        for (const block of parsedBody.blocks) {
          if (summary.length >= maxLength) {
            return summary;
          }
          if (block.type == 'paragraph') {
            if (summary.length) {
              summary += ' ';
            }
            const lengthToAdd = maxLength - summary.length;
            summary += (block.data.text as string)
              .replace(/(<([^>]+)>)/gi, '')
              .replace(/(&([^>]+);)/gi, '')
              .substring(0, maxLength - summary.length);
            if (lengthToAdd < (block.data.text as string).length) {
              summary += '...';
            }
          }
        }
      } catch (e) {}
    }

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-b0b44fbf0ef44779a4dd827fad081b09',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        someone_profile_picture: profile.profile_image ?? '',
        someone_name: profile.first_name,
        accepted_project: {
          link: `https://app.revolancer.com/project/${project.id}`,
          title: need.title ?? '',
          body: summary,
        },
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutUnreadMessages(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-2fdf7c3020504f8db5a005e5f9e48c44',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutRecentNeeds(user: User, extraData: { [key: string]: any }) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-2312f4f2304544e7b3911efdb5d09fd3',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutRecentPortfolios(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-82eb099d81de4b629a62494adf2a605b',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutWelcome(user: User, extraData: { [key: string]: any }) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-3d294155c01448fabcb9c56036c7becf',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutAccountBanned(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-c3fad8ce95bc4680be0428c60ec01e91',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCompleteClient(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const need: NeedPost = extraData.need;
    const project: Project = extraData.project;

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-936d0c6901054b5ebc571ea6ce5068df',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        completed_need: {
          link: `https://app.revolancer.com/project/${project.id}`,
          title: need.title ?? '',
        },
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCompleteContractor(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const need: NeedPost = extraData.need;
    const project: Project = extraData.project;

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-f9af7a97b1504b8eb317e7892f0372a5',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        completed_need: {
          link: `https://app.revolancer.com/project/${project.id}`,
          title: need.title ?? '',
        },
        portfolio_link: 'https://app.revolancer.com/u/profile',
        wallet_link: 'https://app.revolancer.com/projects',
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCancellationCompleteClient(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const need: NeedPost = extraData.need;

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-ec963c29c84946a69008a0067c740f37',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        project: {
          title: need.title ?? '',
        },
        cancelled_projects: 'https://app.revolancer.com/projects/cancelled',
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCancellationCompleteContractor(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const need: NeedPost = extraData.need;

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-ef3b8bd4a8644d04a9cb7dd40f5273f7',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        project: {
          title: need.title ?? '',
        },
        cancelled_projects: 'https://app.revolancer.com/projects/cancelled',
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCancellationCompleteDeletedUser(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const need: NeedPost = extraData.need;

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-3092f7d227bf423395d63613b94f99a9',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        project: {
          title: need.title ?? '',
        },
        cancelled_projects: 'https://app.revolancer.com/projects/cancelled',
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCancellationPendingClient(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const project: Project = extraData.project;
    const need: NeedPost = extraData.need;
    const someone: User = extraData.someone;
    const profile = await this.usersService.getProfile(someone);

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-94739847eded465d86129ba9f7808eb4',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        someone_profile_picture: profile.profile_image ?? '',
        someone_name: profile.first_name,
        project: {
          link: `https://app.revolancer.com/project/${project.id}`,
          title: need.title ?? '',
        },
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCancellationPendingContractor(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const project: Project = extraData.project;
    const need: NeedPost = extraData.need;
    const someone: User = extraData.someone;
    const profile = await this.usersService.getProfile(someone);

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-ef3b8bd4a8644d04a9cb7dd40f5273f7',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        someone_profile_picture: profile.profile_image ?? '',
        someone_name: profile.first_name,
        project: {
          link: `https://app.revolancer.com/project/${project.id}`,
          title: need.title ?? '',
        },
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectUnreadMessages(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const project: Project = extraData.project;
    const someone: User = extraData.someone;
    const profile = await this.usersService.getProfile(someone);

    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-41bc2a6be2f544e7b5459730290611c1',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        someone_profile_picture: profile.profile_image ?? '',
        someone_name: profile.first_name,
        project: {
          link: `https://app.revolancer.com/project/${project.id}`,
          title: project.need.title ?? '',
        },
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutAccountImport(user: User) {
    if (!user.email) return;
    const verifyKey = await this.usersService.getAccountUpgradeToken(user);
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-d54393d1cf3c4822bc84f3e48a0cf809',
      dynamicTemplateData: {
        reset_password: `https://app.revolancer.com/reset-password/${verifyKey}`,
        ...this.dynamicTemplateData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutAccountImportSummary(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-a1a1da8b3ef44e31ab9ff22c9b3ecc43',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutNoNeedsPosted(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-f632e39ce3be4e1889e354bf8e82137e',
      dynamicTemplateData: {
        ...(await this.getRecipientProfileVariables(user)),
        ...this.dynamicTemplateData,
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutNoPortfoliosPosted(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-c19177782024456d976866a324823a4b',
      dynamicTemplateData: {
        ...(await this.getRecipientProfileVariables(user)),
        ...this.dynamicTemplateData,
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }
}
