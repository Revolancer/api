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
      order: { updated_at: 'DESC' },
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

  async getByKey(user: User, key: string) {
    return this.notificationRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
        key: key,
      },
    });
  }

  async get(id: string) {
    return this.notificationRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async createOrUpdate(user: User, message: string, key: string, url: string) {
    let notification = new Notification();

    const existingNotification = await this.getByKey(user, key);
    if (existingNotification) notification = existingNotification;

    notification.user = user;
    notification.message = message;
    notification.key = key;
    notification.url = url;
    notification.read = false;
    notification.read_at = <any>null;

    this.notificationRepository.save(notification);
  }

  async deleteByKey(user: User, key: string) {
    const existingNotification = await this.getByKey(user, key);
    if (existingNotification) {
      this.notificationRepository.remove(existingNotification);
    }
  }
}
