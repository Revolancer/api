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

  async getMessageThreads(user: User) {
    return [];
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
      .getManyAndCount();
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
