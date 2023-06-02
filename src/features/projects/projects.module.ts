import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMessage } from './entities/project-message.entity';
import { CreditsModule } from '../credits/credits.module';
import { NeedModule } from '../need/need.module';
import { UploadModule } from '../upload/upload.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMessage]),
    MailModule,
    CreditsModule,
    NeedModule,
    UploadModule,
    forwardRef(() => UsersModule),
  ],
  providers: [ProjectsService],
  exports: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
