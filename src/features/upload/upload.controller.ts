import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { IUserRequest } from 'src/interface/iuserrequest';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Get('url?')
  @UseGuards(JwtAuthGuard)
  async getSignedUrl(
    @Req() req: IUserRequest,
    @Query('filename') filename: string,
    @Query('size') size: number,
  ) {
    const path = this.uploadService.getFilePathForUser(req.user, filename);
    return this.uploadService.generateSignedUrl(path, size);
  }

  @Post('store')
  @UseGuards(JwtAuthGuard)
  async storeUpload() {
    return '';
  }
}
