import { User } from '../../users/entities/user.entity';

export class StripeJob {
  user: User;
  operation: string;
}
