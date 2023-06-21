import { User } from '../../users/entities/user.entity';

export class AdminJob {
  user: User;
  task: string;
  extraData: { [key: string]: any };
}
