import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { CloudStorageConfigService } from 'src/config/cloud-storage/cloud-storage.service';
import { File } from './entities/file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UploadService {
  private storage: Storage;

  constructor(
    private config: CloudStorageConfigService,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {
    const credentials = JSON.parse(config.key);
    this.storage = new Storage({ credentials });
  }

  getFilePathForUser(user: User, fileName: string) {
    fileName = fileName.replace(/[^A-Za-z0-9\.]/g, '');
    const subDir = uuidv4();
    return `${user.id}/${subDir}/${fileName}`;
  }

  async generateSignedUrl(path: string, size: number) {
    if (size > 40000000) return {}; //40MB max upload size
    const [url] = await this.storage
      .bucket('uploads.revolancer.com')
      .file(path)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        extensionHeaders: {
          'content-length': size,
        },
      });
    return {
      signedUrl: url,
      publicUrl: `https://uploads.revolancer.com/${path}`,
    };
  }

  fileBelongsToUser(user: User, url: string) {
    const prefix = `https://uploads.revolancer.com/${user.id}/`;
    return url.substring(0, prefix.length) === prefix;
  }

  //Store file url to database so we have easy list of files owned by each user
  //Probably not needed since we can query GCP API and list by path, but nice to have nonetheless
  async storeFile(user: User, url: string) {
    if (!this.fileBelongsToUser(user, url)) {
      return false;
    }
    const fNameStart = url.lastIndexOf('/');
    const filename = url.substring(fNameStart + 1);
    this.fileRepository.insert({ filename, url, user: { id: user.id } });
  }

  async getFileByIdAndUser(user: User, id: string) {
    return await this.fileRepository.findOne({
      where: { id: id, user: { id: user.id } },
    });
  }
}
