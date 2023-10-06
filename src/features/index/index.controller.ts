import { Controller, Delete, Put, UseGuards } from '@nestjs/common';
import { IndexService } from './index.service';
import { HasRoles } from '../auth/has-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('admin/index')
export class IndexController {
  constructor(private indexService: IndexService) {}

  /**
   * Delete everything from the index
   */
  @Delete()
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async clearIndex() {
    return this.indexService.clearIndex();
  }

  /**
   * Index or re-index every user
   */
  @Put('users')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async indexUsers() {
    return this.indexService.indexAllUsers();
  }

  /**
   * Index or re-index every need
   */
  @Put('needs')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async indexNeeds() {
    return this.indexService.indexAllNeeds();
  }

  /**
   * Index or re-index every portfolio
   */
  @Put('portfolios')
  @HasRoles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async indexPortfolios() {
    return this.indexService.indexAllPortfolios();
  }
}
