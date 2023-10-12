import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentIndex } from '../index/entities/contentindex.entity';
import { Brackets, ILike, In, Repository } from 'typeorm';
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
    this.logger.log(`Search for ${term}`);
    //TODO: Implement relevance once we have real indexing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const orderBy = sort == 'created' ? 'created_at' : 'created_at';
    if (tag.length) {
      this.logger.log(`Search by tag`);
      tag.map((tag) => {
        if (!isValidUUID(tag))
          throw new BadRequestException('Invalid Tag ID format');
      });

      let query = this.indexRepository
        .createQueryBuilder()
        .select('"otherId", "contentType"');

      for (const id of tag) {
        query = query.orWhere(
          new Brackets((qb) => {
            qb.where(':id = ANY("tagIds")', { id }); //.andWhere(
            //  '"contentType" in (:type)',
            //  { type: dataType },
            //);
            //TODO: Filtering content type breaks query? Why?
          }),
        );
      }

      return [
        await query
          .take(20)
          .skip(20 * (page - 1))
          .execute(),
        Number((await query.select('count(*)').execute())[0]['count']),
      ];
    }

    return this.indexRepository.findAndCount({
      select: {
        otherId: true,
        contentType: true,
      },
      where: {
        body: ILike(`%${term}%`),
        contentType: In(dataType),
      },
      order: { created_at: order == 'ASC' ? 'ASC' : 'DESC' },
      take: 20,
      skip: 20 * (page - 1),
    });
  }
}
