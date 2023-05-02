import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import { SendMessageDto } from './dto/sendmessage.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tagsService: TagsService,
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
      return a.created_at > b.created_at ? 1 : -1;
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
}
