import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMessage } from './entities/project-message.entity';
import { CreditsModule } from '../credits/credits.module';
import { NeedModule } from '../need/need.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMessage]),
    CreditsModule,
    NeedModule,
  ],
  providers: [ProjectsService],
  exports: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
