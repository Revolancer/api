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
import { CreateTagDto } from './dto/create-user.dto';
import { TagsService } from './tags.service';
import { HasRoles } from '../auth/has-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';

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
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async createTag(@Req() req: IUserRequest, @Body() body: CreateTagDto) {
    return await this.tagsService.createTag(body);
  }

  @Delete(':id')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteTag(@Param('id') id: string) {
    return await this.tagsService.deleteTag(id);
  }
}
