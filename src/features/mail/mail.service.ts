import { InjectQueue } from '@nestjs/bull';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { SendgridConfigService } from 'src/config/sendgrid/config.service';
import { User } from '../users/entities/user.entity';
import { MailJob } from './queue/mail.job';
import { MailDataRequired, MailService as Sendgrid } from '@sendgrid/mail';
import { UsersService } from '../users/users.service';
import { Mailout } from './mailout.type';

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
  ) {
    this.sendgrid = new Sendgrid();
    this.sendgrid.setApiKey(config.key);
  }

  /**
   * Use this method to queue an email
   * Avoids doing expensive API calls before returning account details to new user
   * @param user The user to link
   */
  async scheduleMail(user: User, mailout: Mailout): Promise<void> {
    await this.mailQueue.add({
      user: { ...user, password: '' },
      mailout,
    });
  }

  async sendMailoutEmailVerify(user: User) {
    if (!user.email) return;
    const verifyKey = await this.usersService.getEmailVerifyToken(user);
    const mail = {
      to: user.email,
      from: this.sender,
      replyTo: this.replyTo,
      templateId: 'd-237dbabb52784f78b9b4955172ae8c20',
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
}
