import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentIndex } from '../index/entities/contentindex.entity';
import { Brackets, Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  constructor(
    @InjectRepository(ContentIndex)
    private indexRepository: Repository<ContentIndex>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async search(
    dataType: ('user' | 'need' | 'portfolio')[] = ['need', 'portfolio'],
    sort: 'created' | 'relevance' = 'relevance',
    order: 'ASC' | 'DESC' = 'DESC',
    term: string = '',
    tag: string[] = [],
    page = 1,
  ) {
    let cachekey = `search-cache-${page}-${term.replace(/ /g, '+')}`;
    //TODO: Implement relevance once we have real indexing
    const orderBy =
      sort == 'created' ? 'content_created_at' : 'content_created_at';

    //Sanitise datatypes to prevent injection attack
    const dataTypesClean = [];
    if (dataType.includes('need')) dataTypesClean.push('need');
    if (dataType.includes('portfolio')) dataTypesClean.push('portfolio');
    if (dataType.includes('user')) dataTypesClean.push('user');

    if (order !== 'ASC' && order !== 'DESC')
      throw new BadRequestException('Invalid Order');

    if (sort !== 'created' && sort !== 'relevance')
      throw new BadRequestException('Invalid Sort');

    if (page < 1 || !(Math.floor(page) == page)) {
      throw new BadRequestException('Invalid Page');
    }
    const tagsDeDuped = [...new Set(tag)].sort();

    if (tagsDeDuped.length > 0) {
      cachekey = `cache-search-tags-${page}-${tagsDeDuped.join('-')}-${term.replace(
        / /g,
        '+',
      )}`;
      const cached = await this.cacheManager.get(cachekey);
      if (cached) return cached;
    }

    let query = this.indexRepository
      .createQueryBuilder()
      .select('"otherId", "contentType"')
      .where(
        `"contentType" in (${dataTypesClean.map((v) => `'${v}'`).join(',')})`,
      )
      .orderBy({ [orderBy]: order })
      .take(20)
      .skip(20 * (page - 1));

    if (tagsDeDuped.length > 0) {
      tagsDeDuped.map((tag) => {
        if (!isValidUUID(tag))
          throw new BadRequestException('Invalid Tag ID format');
      });

      query = query.andWhere(
        new Brackets((qb) => {
          let i = 0;
          for (const id of tagsDeDuped) {
            qb.orWhere(`:id${i} = ANY("tagIds")`, { [`id${i}`]: id });
            i++;
          }
        }),
      );
    }

    if (term.length > 0) {
      query = query.andWhere('body ILIKE :term', { term: `%${term}%` });
    }

    const result = [await query.execute(), await query.getCount()];

    await this.cacheManager.set(cachekey, result, 2 * 60 * 1000);

    return result;
  }
}
