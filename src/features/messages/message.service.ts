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
import { LastMail } from '../mail/entities/last-mail.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private tagsService: TagsService,
    @Inject(forwardRef(() => MailService))
    private mailService: MailService,
    @InjectRepository(LastMail)
    private lastMailRepository: Repository<LastMail>,
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
    const lastUnreadMessagesEmail = await this.lastMailRepository.findOne({
      where: {
        user: { id: user.id },
        mailout: 'unread_messages',
      },
    });
    let shouldMail = true;
    const userLastActive = await this.usersService.getLastActive(user);
    if (lastUnreadMessagesEmail) {
      if (
        DateTime.fromJSDate(lastUnreadMessagesEmail.last_mail).plus({
          day: 7,
        }) > DateTime.now()
      ) {
        shouldMail = false;
        if (
          userLastActive >
          DateTime.fromJSDate(lastUnreadMessagesEmail.last_mail)
        ) {
          shouldMail = true;
        }
      }
    }
    if (userLastActive.plus({ minute: 30 }) > DateTime.now()) {
      shouldMail = false;
    }
    if (!shouldMail) {
      return;
    }

    const unread = await this.getUnreadCount(user);

    this.mailService.scheduleMail(user, 'unread_messages', {
      unread_messages: unread,
    });

    if (lastUnreadMessagesEmail) {
      lastUnreadMessagesEmail.last_mail = DateTime.now().toJSDate();
      this.lastMailRepository.save(lastUnreadMessagesEmail);
    } else {
      const messageSent = new LastMail();
      messageSent.last_mail = DateTime.now().toJSDate();
      messageSent.mailout = 'unread_messages';
      messageSent.user = user;
      this.lastMailRepository.save(messageSent);
    }
  }

  /**
   * Send an email to all users with unread messages greater than 12 hours old
   * If they have recieved this email since they were last active, do not resend it
   */
  @Cron('* */10 * * * *')
  async alertUsersWithUnreadMessages() {
    const alertTime = DateTime.now().minus({ hour: 12 }).toJSDate();
    const unreads = await this.messageRepository
      .createQueryBuilder()
      .select('message')
      .from(Message, 'message')
      .where('message.read = false')
      .andWhere('message.created_at < :time', { time: alertTime })
      .loadAllRelationIds()
      .distinctOn(['message.recieverId'])
      .getMany();
    for (const unread of unreads) {
      const user = await this.userRepository.findOne({
        where: {
          id: unread.reciever as unknown as string,
        },
        select: { id: true, email: true },
      });
      if (user) {
        this.scheduleUnreadMessagesEmail(user);
      }
    }
  }
}
