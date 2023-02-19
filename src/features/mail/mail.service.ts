import { InjectQueue } from '@nestjs/bull';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { SendgridConfigService } from 'src/config/sendgrid/config.service';
import { User } from '../users/entities/user.entity';
import { MailJob } from './queue/mail.job';
import { MailService as Sendgrid } from '@sendgrid/mail';
import { UsersService } from '../users/users.service';
import { Mailout } from './mailout.type';

@Injectable()
export class MailService {
  private sendgrid: Sendgrid;
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
    await this.mailQueue.add({ user, mailout });
  }

  async sendMailoutEmailVerify(user: User) {
    if (!user.email) return;
    const verifyKey = await this.usersService.getEmailVerifyToken(user);
    const mail = {
      to: user.email,
      from: 'info@revolancer.com',
      templateId: 'd-237dbabb52784f78b9b4955172ae8c20',
      dynamicTemplateData: {
        verify_url: `https://app.revolancer.com/verify-email?key=${verifyKey}`,
      },
    };
    this.sendgrid.send(mail);
  }

  async sendMailoutPasswordReset(user: User) {
    if (!user.email) return;
    const verifyKey = await this.usersService.getPasswordResetToken(user);
    const mail = {
      to: user.email,
      from: 'info@revolancer.com',
      templateId: 'd-5ca7900988644adf8970d9e8cbeaaf5c',
      dynamicTemplateData: {
        verify_url: `https://app.revolancer.com/reset-password?key=${verifyKey}`,
      },
    };
    this.sendgrid.send(mail);
  }
}
