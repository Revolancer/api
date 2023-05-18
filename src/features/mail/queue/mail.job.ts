import { User } from '../../users/entities/user.entity';

export class MailJob {
  user: User;
  mailout: string;
  extraData: { [key: string]: any };
}
