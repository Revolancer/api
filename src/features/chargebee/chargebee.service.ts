import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargebeeUser } from './entities/chargebeeuser.entity';
import { User } from '../users/entities/user.entity';
import { ChargeBee, _customer } from 'chargebee-typescript';
import { ChargebeeConfigService } from 'src/config/chargebee/config.service';
import { ListResult } from 'chargebee-typescript/lib/list_result';
import { Result } from 'chargebee-typescript/lib/result';
import { ChargebeeJob } from './queue/chargebee.job';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class ChargebeeService {
  private chargebee: ChargeBee;

  constructor(
    @InjectRepository(ChargebeeUser)
    private chargebeeRepository: Repository<ChargebeeUser>,
    private config: ChargebeeConfigService,
    @InjectQueue('chargebee') private chargebeeQueue: Queue<ChargebeeJob>,
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
    return chargebeeUser.id;
  }

  async findRemoteAndLink(user: User): Promise<void> {
    //Did we already link this user to chargebee?
    const prelinked = await this.findOneByUser(user);
    if (prelinked) return;
    //Find chargebee customer with same email
    const params: _customer.customer_list_params = {
      email: { is: user.email },
    };
    const result: ListResult = await this.chargebee.customer
      .list(params)
      .request();
    if (result.list.length > 0) {
      const customer_id = result.list[0].customer.id;
      await this.create(user, customer_id);
    }
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

  async linkToRemote(user: User): Promise<void> {
    await this.findRemoteAndLink(user);
    const linked = await this.findOneByUser(user);
    if (linked == null) {
      await this.createRemoteAndLink(user);
    }
  }

  async queueLink(user: User): Promise<void> {
    this.chargebeeQueue.add({ user, task: 'link_user' });
  }
}
