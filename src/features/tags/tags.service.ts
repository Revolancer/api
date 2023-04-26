import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTagDto } from './dto/create-user.dto';
import { Tag } from './entities/tag.entity';

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
    this.tagsRepository.delete({ id: id });
  }
}
