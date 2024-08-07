import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(
    @Query('term') term: string | undefined,
    @Query('tag') tag: string[] | undefined,
    @Query('page') page: number | undefined,
    @Query('sort') sortBy: 'created' | 'relevance' | undefined,
    @Query('order') order: 'ASC' | 'DESC' | undefined,
    @Query('datatype') dataType: ('user' | 'need' | 'portfolio')[] | undefined,
  ) {
    if (term == '' && (tag?.length ?? 0) < 1)
      throw new BadRequestException('Please provide a search term');
    return this.searchService.search(dataType, sortBy, order, term, tag, page);
  }
}
