import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IUserRequest } from 'src/interface/iuserrequest';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { CreateTagDto } from './dto/create-user.dto';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  async getTagsList() {
    return await this.tagsService.findAll();
  }

  @Get('with_parents')
  async getTagsListWithParents() {
    return await this.tagsService.findAllWithParents();
  }

  @Put()
  @UseGuards(AdminAuthGuard)
  async createTag(@Req() req: IUserRequest, @Body() body: CreateTagDto) {
    return await this.tagsService.createTag(body);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async deleteTag(@Param('id') id: string) {
    return await this.tagsService.deleteTag(id);
  }
}
