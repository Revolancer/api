import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CreditLogEntry } from './entities/credit-log-entry.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBalance } from './entities/user-balance.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { DateTime } from 'luxon';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditLogEntry)
    private creditLogRepository: Repository<CreditLogEntry>,
    @InjectRepository(UserBalance)
    private balanceRepository: Repository<UserBalance>,
    private notificationsService: NotificationsService,
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

  async getUserCreditLog(user: User) {
    return await this.creditLogRepository.find({
      where: { user: { id: user.id } },
      order: { updated_at: 'DESC' },
    });
  }

  async getUserCreditLogReverse(user: User) {
    return await this.creditLogRepository.find({
      where: { user: { id: user.id } },
      order: { updated_at: 'ASC' },
    });
  }

  async getUserCreditsForAdmin(id: string): Promise<number> {
    const balance = await this.balanceRepository.findOne({
      where: { user: { id: id } },
    });
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  async getUserCreditLogForAdmin(id: string) {
    return await this.creditLogRepository.find({
      where: { user: { id: id } },
      order: { updated_at: 'DESC' },
    });
  }

  async getUserCreditLogReverseForAdmin(id: string) {
    return await this.creditLogRepository.find({
      where: { user: { id: id } },
      order: { updated_at: 'ASC' },
    });
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
    const saved = await this.creditLogRepository.save(entry);
    this.notificationsService.createOrUpdate(
      user,
      `You have ${amount > 0 ? 'gained' : 'lost'} ${Math.abs(
        amount,
      )} credits due to ${reason}`,
      `credit-log-${saved.id}`,
      `/projects`,
    );
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

  async assignMonthlyBonusCredits() {
    const oneMonthAgo = DateTime.now().minus({ month: 1 });
    const wallets = await this.balanceRepository.find({
      relations: ['user'],
    });
    for (const wallet of wallets) {
      const uid = wallet.user.id;
      const lastTopup = await this.creditLogRepository.findOne({
        where: { user: { id: uid }, reason: 'Monthly bonus' },
        order: { created_at: 'DESC' },
      });
      if (
        !lastTopup ||
        DateTime.fromJSDate(lastTopup.created_at) <= oneMonthAgo
      ) {
        this.addOrRemoveUserCredits(wallet.user, 50, 'Monthly bonus');
      }
    }
  }
}
