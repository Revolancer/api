import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Storage } from '@google-cloud/storage';
import { CreditLogEntry } from './entities/credit-log-entry.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBalance } from './entities/user-balance.entity';

@Injectable()
export class CreditsService {
  private storage: Storage;

  constructor(
    @InjectRepository(CreditLogEntry)
    private creditLogRepository: Repository<CreditLogEntry>,
    @InjectRepository(UserBalance)
    private balanceRepository: Repository<UserBalance>,
  ) {}

  async getUserCredits(user: User): Promise<number> {
    const balance = await this.balanceRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (balance) {
      return balance.balance;
    }
    await this.createWalletForUser(user);
    return 0;
  }

  async addOrRemoveUserCredits(user: User, amount: number, reason = '') {
    amount = Math.floor(amount);
    const currentCredits = await this.getUserCredits(user);
    const balance = await this.balanceRepository.findOneOrFail({
      where: { user: { id: user.id } },
    });
    const result = currentCredits + amount;
    balance.balance = result;
    this.balanceRepository.save(balance);
    const entry = new CreditLogEntry();
    entry.change = amount;
    entry.reason = reason;
    entry.user = user;
    entry.resultant_amount = result;
    this.creditLogRepository.save(entry);
  }

  async createWalletForUser(user: User) {
    const balance = await this.balanceRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!balance) {
      const balance = new UserBalance();
      balance.balance = 0;
      balance.user = user;
      this.balanceRepository.save(balance);
    }
  }
}
