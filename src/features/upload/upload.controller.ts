import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { IUserRequest } from 'src/interface/iuserrequest';
import { StoreFileDto } from './dto/storefile.dto';

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

  @Put('store')
  @UseGuards(JwtAuthGuard)
  async storeUpload(@Req() req: IUserRequest, @Body() body: StoreFileDto) {
    return this.uploadService.storeFile(req.user, body.fileName);
  }
}
