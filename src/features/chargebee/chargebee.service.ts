import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargebeeUser } from './entities/chargebeeuser.entity';
import { User } from '../users/entities/user.entity';
import {
  ChargeBee,
  _customer,
  _hosted_page,
  _portal_session,
  _subscription,
} from 'chargebee-typescript';
import { ChargebeeConfigService } from 'src/config/chargebee/config.service';
import { ListResult } from 'chargebee-typescript/lib/list_result';
import { Result } from 'chargebee-typescript/lib/result';
import { Subscription } from 'chargebee-typescript/lib/resources';
import { DateTime } from 'luxon';

@Injectable()
export class ChargebeeService {
  private chargebee: ChargeBee;

  constructor(
    @InjectRepository(ChargebeeUser)
    private chargebeeRepository: Repository<ChargebeeUser>,
    private config: ChargebeeConfigService,
  ) {
    this.chargebee = new ChargeBee();
    this.chargebee.configure({
      site: this.config.site,
      api_key: this.config.key,
    });
  }

  findOne(id: string): Promise<ChargebeeUser | null> {
    return this.chargebeeRepository.findOne({
      relations: ['user'],
      where: { id: id },
    });
  }

  async findOneByUser(user: User): Promise<ChargebeeUser | null> {
    return this.chargebeeRepository.findOne({
      relations: ['user'],
      where: { user: { id: user.id } },
    });
  }

  async remove(id: string): Promise<void> {
    const bee = await this.findOne(id);
    if (bee === null) {
      return;
    }
    await this.chargebeeRepository.softRemove(bee);
  }

  async create(user: User, chargebeeId: string): Promise<string> {
    const newChargebeeUser = this.chargebeeRepository.create({
      user: user,
      chargebee_id: chargebeeId,
    });
    const chargebeeUser = await this.chargebeeRepository.save(newChargebeeUser);
    this.createSubscription(chargebeeUser);
    return chargebeeUser.id;
  }

  async createSubscription(customer: ChargebeeUser) {
    const trial_end = Math.floor(DateTime.now().plus({ day: 30 }).toSeconds());
    this.chargebee.subscription
      .create_with_items(customer.chargebee_id, {
        subscription_items: [
          {
            item_price_id: 'Revolancer-GBP-Monthly',
            trial_end: trial_end,
          },
        ],
      })
      .request();
  }

  async createRemoteAndLink(user: User): Promise<void> {
    const params: _customer.create_params = {
      email: user.email,
    };
    const result: Result = await this.chargebee.customer
      .create(params)
      .request();
    await this.create(user, result.customer.id);
  }

  async createPortalSession(user: User): Promise<string> {
    const customer = await this.findOneByUser(user);
    if (customer == null) {
      throw new Error('No customer linked to the current user');
    }
    const params: _portal_session.create_params = {
      customer: {
        id: customer.chargebee_id,
      },
    };
    const response: Result = await this.chargebee.portal_session
      .create(params)
      .request();
    return String(response.portal_session);
  }

  async createCheckoutPage(user: User): Promise<string> {
    const customer = await this.findOneByUser(user);
    if (customer == null) {
      throw new Error('No customer linked to the current user');
    }
    const params: _hosted_page.checkout_new_for_items_params = {
      layout: 'in_app',
      customer: {
        id: customer.chargebee_id,
      },
      subscription_items: [{ item_price_id: 'Revolancer-GBP-Monthly' }],
    };
    const response: Result = await this.chargebee.hosted_page
      .checkout_new_for_items(params)
      .request();
    return String(response.hosted_page);
  }

  async getSubscription(customer: ChargebeeUser): Promise<Subscription | void> {
    const params: _subscription.subscription_list_params = {
      customer_id: { is: customer.chargebee_id },
      item_price_id: { is: 'Revolancer-GBP-Monthly' },
    };
    const result: ListResult = await this.chargebee.subscription
      .list(params)
      .request();

    if (result.list.length > 0) {
      return result.list[0].subscription;
    }
  }

  async getCardStatus(customer: ChargebeeUser): Promise<string> {
    const result: Result = await this.chargebee.customer
      .retrieve(customer.chargebee_id)
      .request();
    return result.customer.card_status ?? 'no_card';
  }
}
