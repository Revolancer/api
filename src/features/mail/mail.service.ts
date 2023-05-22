import { InjectQueue } from '@nestjs/bull';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { Cron } from '@nestjs/schedule';

@Injectable()
export class MailService {
  private sendgrid: Sendgrid;

  private dynamicTemplateData = {
    manage_email_preferences_link: 'https://app.revolancer.com/settings/email',
    revolancer_logo_link: 'https://app.revolancer.com/',
    contact_support_link: 'mailto:support@revolancer.com',
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
        ...(await this.getRecipientProfileVariables(user)),
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
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-7c88be4ed0b24ba0aba2aea9071f5156',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProposalAccepted(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-b0b44fbf0ef44779a4dd827fad081b09',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
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
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-936d0c6901054b5ebc571ea6ce5068df',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutProjectCompleteContractor(
    user: User,
    extraData: { [key: string]: any },
  ) {
    if (!user.email) return;
    const mail: MailDataRequired = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-f9af7a97b1504b8eb317e7892f0372a5',
      dynamicTemplateData: {
        ...this.dynamicTemplateData,
        ...(await this.getRecipientProfileVariables(user)),
        ...extraData,
      },
    };
    this.sendgrid.send(mail);
  }

  @Cron('0 0 * * * *')
  async cleanMailQueue() {
    //Clean up jobs completed more than 100 seconds ago
    this.mailQueue.clean(100000);
    //Clean up jobs failed more than 1 day ago
    this.mailQueue.clean(86400000, 'failed');
  }
}
