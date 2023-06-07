import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { DateTime } from 'luxon';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(user: User) {
    return this.notificationRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async countUnreadNotifications(user: User) {
    return this.notificationRepository.count({
      where: { user: { id: user.id }, read: false },
    });
  }

  async markNotificationAsRead(user: User, id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: id, user: { id: user.id } },
    });
    if (!notification) {
      throw new NotFoundException();
    }
    notification.read = true;
    notification.read_at = DateTime.now().toJSDate();
    this.notificationRepository.save(notification);
  }
}
