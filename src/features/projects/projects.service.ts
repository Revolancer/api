import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from './entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMessage } from './entities/project-message.entity';
import { CreditsService } from '../credits/credits.service';
import { User } from '../users/entities/user.entity';
import { NewProjectDto } from './dto/newproject.dto';
import { NeedService } from '../need/need.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMessage)
    private projectMessageRepository: Repository<ProjectMessage>,
    private creditsService: CreditsService,
    private needService: NeedService,
  ) {}

  async createProject(user: User, body: NewProjectDto) {
    const need = await this.needService.getNeed(body.need);
    if (!need || need.user.id != user.id) {
      throw new NotFoundException();
    }
    const proposal = await this.needService.getProposal(body.proposal);
    if (!proposal || proposal.need.id != need.id) {
      throw new NotFoundException();
    }
    const project = new Project();
    project.client = <any>{ id: user.id };
    project.contractor = <any>{ id: proposal.user.id };
    project.need = <any>{ id: need.id };
    project.proposal = <any>{ id: proposal.id };
    project.credits = proposal.price;
    project.status = 'active';
    const savedProject = await this.projectRepository.save(project);
    this.creditsService.addOrRemoveUserCredits(
      user,
      0 - proposal.price,
      need.title ?? 'Untitled Project',
    );
    return savedProject.id;
  }
}
