import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Brackets, LessThan, Repository } from 'typeorm';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import { SendMessageDto } from './dto/sendmessage.dto';
import { Message } from './entities/message.entity';
import { DateTime } from 'luxon';
import { MailService } from '../mail/mail.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tagsService: TagsService,
    @Inject(forwardRef(() => MailService))
    private mailService: MailService,
  ) {}

  /**
   * Get unique message threads for the given user
   * @param user The user whose threads we need
   * @returns an array of unique message threads
   */
  async getMessageThreads(user: User) {
    const builder = this.messageRepository.createQueryBuilder('message');
    const result: { [key: string]: Message } = {};
    const threads = await builder
      .distinctOn(['message.sender', 'message.reciever'])
      .where('message.sender = :sender', { sender: user.id })
      .orWhere('message.reciever = :reciever', { reciever: user.id })
      .orderBy('message.sender', 'DESC')
      .addOrderBy('message.reciever', 'DESC')
      .addOrderBy('message.created_at', 'DESC')
      .loadRelationIdAndMap('sender', 'message.sender')
      .loadRelationIdAndMap('reciever', 'message.reciever')
      .getMany();
    threads.sort((a, b) => {
      return a.created_at > b.created_at ? -1 : 1;
    });
    for (const message of threads) {
      let otherId;
      if ((message.reciever as any as string) == user.id) {
        otherId = message.sender as any as string;
      } else {
        otherId = message.reciever as any as string;
      }

      if (!result[otherId]) {
        result[otherId] = message;
      }
    }
    const resultArray: Message[] = [];
    for (const [_, value] of Object.entries(result)) {
      resultArray.push(value);
    }
    resultArray.sort((a, b) => {
      return a.created_at > b.created_at ? -1 : 1;
    });

    return resultArray;
  }

  async getMessagesBetween(uid1: string, uid2: string) {
    const sender = await this.userRepository.findOneOrFail({
      where: { id: uid1 },
    });
    const recipient = await this.userRepository.findOneOrFail({
      where: { id: uid2 },
    });
    const builder = this.messageRepository.createQueryBuilder('message');
    return await builder
      .where(
        new Brackets((qb) => {
          qb.where('message.reciever.id = :recipient', {
            recipient: recipient.id,
          })
            .andWhere('message.sender.id = :sender', { sender: sender.id })
            .andWhere('message.admin_hidden = false');
        }),
      )
      .orWhere(
        new Brackets((qb) => {
          qb.where('message.sender.id = :recipient', {
            recipient: recipient.id,
          })
            .andWhere('message.reciever.id = :sender', { sender: sender.id })
            .andWhere('message.admin_hidden = false');
        }),
      )
      .loadRelationIdAndMap('sender', 'message.sender')
      .loadRelationIdAndMap('reciever', 'message.reciever')
      .orderBy('message.created_at', 'ASC')
      .getMany();
  }

  async sendMessage(user: User, recipientId: string, body: SendMessageDto) {
    const recipient = await this.userRepository.findOneOrFail({
      where: { id: recipientId },
    });
    const message = new Message();
    message.sender = user;
    message.reciever = recipient;
    message.body = body.body;
    this.messageRepository.save(message);
  }

  async getUnreadCount(user: User) {
    return this.messageRepository.count({
      where: { reciever: { id: user.id }, read: false },
    });
  }

  async getAllMessageCount(user: User) {
    return this.messageRepository.count({
      where: [{ reciever: { id: user.id } }, { sender: user }],
    });
  }

  async markMessageAsRead(user: User, id: string) {
    const message = await this.messageRepository.findOne({
      where: { id: id, reciever: { id: user.id } },
    });
    if (!message) return;
    message.read = true;
    message.read_at = DateTime.now().toJSDate();
    this.messageRepository.save(message);
  }

  async scheduleUnreadMessagesEmail(user: User) {
    const unread = await this.getUnreadCount(user);
    this.mailService.scheduleMail(user, 'unread_messages', {
      unread_messages: unread,
    });
  }

  /**
   * Send an email to all users with unread messages greater than 12 hours old
   * If they have recieved this email since they were last active, do not resend it
   */
  @Cron('0 */15 * * * *')
  async alertUsersWithUnreadMessages() {
    const tooOld = DateTime.now().minus({ day: 30 }).toJSDate();
    const alertTime = DateTime.now().minus({ hour: 12 }).toJSDate();
    const oldUnreads = await this.messageRepository.find({
      where: { read: false, created_at: Between(tooOld, alertTime) },
      relations: ['reciever'],
    });
    const usersToAlertIDs: string[] = [];
    const usersToAlert: User[] = [];
    for (const message of oldUnreads) {
      if (!usersToAlertIDs.includes(message.reciever.id)) {
        usersToAlert.push(message.reciever);
        usersToAlertIDs.push(message.reciever.id);
      }
    }
    for (const user of usersToAlert) {
      this.scheduleUnreadMessagesEmail(user);
    }
  }
}
