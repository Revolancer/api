import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeConfigService } from 'src/config/stripe/config.service';
import { Stripe } from 'stripe';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { StripeUser } from './entities/stripeuser.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private config: StripeConfigService,
    @InjectRepository(StripeUser)
    private stripeUserRepository: Repository<StripeUser>,
  ) {
    this.stripe = new Stripe(config.sk ?? '', {
      apiVersion: '2022-11-15',
    });
  }

  async findStripeUserByEmail(user: User): Promise<string | void> {
    const email = user.email ?? '';
    const results = await this.stripe.customers.search({
      query: `email: "${email}"`,
    });
    if (results.data.length == 0) {
      return;
    }
    return results.data[0].id;
  }

  async createStripeUser(user: User): Promise<string> {
    const email = user.email ?? '';
    let params = {};
    if (email !== '') {
      params = {
        email: email,
      };
    }
    const result = await this.stripe.customers.create(params);
    return result.id;
  }

  async associateStripeUser(user: User, stripeUserId: string): Promise<void> {
    await this.stripeUserRepository.upsert(
      { user: user, stripe_id: stripeUserId },
      ['user'],
    );
  }

  async getStripeUser(user: User): Promise<void> {
    await this.stripeUserRepository.findOne({ where: { user: user } });
  }

  async findOrCreateStripeUser(user: User): Promise<void> {
    const existingStripeUser = await this.findStripeUserByEmail(user);
    if (typeof existingStripeUser == 'string') {
      this.associateStripeUser(user, existingStripeUser);
      return;
    }
    this.associateStripeUser(user, await this.createStripeUser(user));
  }
}
