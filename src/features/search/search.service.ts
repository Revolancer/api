import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentIndex } from '../index/entities/contentindex.entity';
import { Brackets, Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  constructor(
    @InjectRepository(ContentIndex)
    private indexRepository: Repository<ContentIndex>,
  ) {}

  async search(
    dataType: ('user' | 'need' | 'portfolio')[] = ['need', 'portfolio'],
    sort: 'created' | 'relevance' = 'relevance',
    order: 'ASC' | 'DESC' = 'DESC',
    term: string = '',
    tag: string[] = [],
    page = 1,
  ) {
    //TODO: Implement relevance once we have real indexing
    const orderBy = sort == 'created' ? 'created_at' : 'created_at';

    //Sanitise datatypes to prevent injection attack
    const dataTypesClean = [];
    if (dataType.includes('need')) dataTypesClean.push('need');
    if (dataType.includes('portfolio')) dataTypesClean.push('portfolio');
    if (dataType.includes('user')) dataTypesClean.push('user');

    if (order !== 'ASC' && order !== 'DESC')
      throw new BadRequestException('Invalid Order');

    if (sort !== 'created' && sort !== 'relevance')
      throw new BadRequestException('Invalid Sort');

    if (page < 1 || !Number.isSafeInteger(page))
      throw new BadRequestException('Invalid Page');

    let query = this.indexRepository
      .createQueryBuilder()
      .select('"otherId", "contentType", "created_at"')
      .where(
        `"contentType" in (${dataTypesClean.map((v) => `'${v}'`).join(',')})`,
      )
      .orderBy({ [orderBy]: order });

    if (tag.length) {
      tag.map((tag) => {
        if (!isValidUUID(tag))
          throw new BadRequestException('Invalid Tag ID format');
      });

      query = query.andWhere(
        new Brackets((qb) => {
          let i = 0;
          for (const id of tag) {
            qb.orWhere(`:id${i} = ANY("tagIds")`, { [`id${i}`]: id });
            i++;
          }
        }),
      );
    } else {
      query = query.andWhere('body ILIKE :term', { term: `%${term}%` });
    }

    return [
      await query
        .take(20)
        .skip(20 * (page - 1))
        .execute(),
      Number((await query.select('count(*)').orderBy().execute())[0]['count']),
    ];
  }
}
