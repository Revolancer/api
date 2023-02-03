import { User } from '../users/entities/user.entity';

export class StripeQueueJob {
  user: User;
  operation: string;
}
