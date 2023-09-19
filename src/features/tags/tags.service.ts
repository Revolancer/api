import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTagDto } from './dto/create-user.dto';
import { Tag } from './entities/tag.entity';
import { validate as isValidUUID } from 'uuid';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  findAll(): Promise<Tag[]> {
    return this.tagsRepository.find();
  }

  findAllWithParents(): Promise<Tag[]> {
    return this.tagsRepository.find({ relations: ['parent'] });
  }

  findOne(id: string): Promise<Tag | null> {
    if (!isValidUUID(id)) throw new BadRequestException('Invalid ID Format');
    return this.tagsRepository.findOne({
      where: { id: id },
    });
  }

  async createTag(body: CreateTagDto) {
    const newTag = this.tagsRepository.create();
    newTag.text = body.text;
    if (body.parent != undefined && body.parent != '') {
      newTag.parent = await this.tagsRepository.findOneByOrFail({
        id: body.parent,
      });
    }
    this.tagsRepository.save(newTag);
  }

  async deleteTag(id: string) {
    if (!isValidUUID(id)) throw new BadRequestException('Invalid ID Format');
    this.tagsRepository.delete({ id: id });
  }
}
