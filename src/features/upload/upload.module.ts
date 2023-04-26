import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudStorageConfigModule } from 'src/config/cloud-storage/cloud-storage.module';
import { File } from './entities/file.entity';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [CloudStorageConfigModule, TypeOrmModule.forFeature([File])],
  providers: [UploadService],
  exports: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
