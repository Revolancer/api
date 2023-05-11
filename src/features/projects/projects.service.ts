import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from './entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ProjectMessage } from './entities/project-message.entity';
import { CreditsService } from '../credits/credits.service';
import { User } from '../users/entities/user.entity';
import { NewProjectDto } from './dto/newproject.dto';
import { NeedService } from '../need/need.service';
import { SendProjectMessageDto } from './dto/sendprojectmessage.dto';
import { UploadService } from '../upload/upload.service';
import { validate as isValidUUID } from 'uuid';
import { DateTime } from 'luxon';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMessage)
    private projectMessageRepository: Repository<ProjectMessage>,
    private creditsService: CreditsService,
    private needService: NeedService,
    private uploadService: UploadService,
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
    try {
      this.needService.unPublishNeed(need.id);
    } catch (err) {}
    this.creditsService.addOrRemoveUserCredits(
      user,
      0 - proposal.price,
      `Project: ${need.title}` ?? 'Untitled Project',
    );
    return savedProject.id;
  }

  async getProject(user: User, id: string) {
    return this.projectRepository.findOne({
      where: [
        { id: id, client: { id: user.id } },
        { id: id, contractor: { id: user.id } },
      ],
      relations: ['client', 'contractor'],
      select: { client: { id: true }, contractor: { id: true } },
    });
  }

  async getActiveProjects(user: User) {
    return this.projectRepository.find({
      where: [
        { client: { id: user.id }, status: 'active' },
        { contractor: { id: user.id }, status: 'active' },
      ],
      relations: ['client', 'contractor', 'need'],
      select: { client: { id: true }, contractor: { id: true } },
    });
  }

  async countActiveProjects(user: User) {
    return this.projectRepository.count({
      where: [
        { client: { id: user.id }, status: 'active' },
        { contractor: { id: user.id }, status: 'active' },
      ],
      relations: ['client', 'contractor'],
      select: { client: { id: true }, contractor: { id: true } },
    });
  }

  async getProjectMessages(user: User, id: string) {
    const project = await this.projectRepository.findOne({
      where: [
        { id: id, client: { id: user.id } },
        { id: id, contractor: { id: user.id } },
      ],
      relations: ['client', 'contractor'],
      select: { client: { id: true }, contractor: { id: true } },
    });
    if (!project) {
      throw new NotFoundException();
    }
    return this.projectMessageRepository.find({
      where: { project: { id: project.id } },
      relations: ['user'],
      select: { user: { id: true } },
    });
  }

  async sendProjectMessage(
    user: User,
    id: string,
    body: SendProjectMessageDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: [
        { id: id, client: { id: user.id } },
        { id: id, contractor: { id: user.id } },
      ],
      relations: ['client', 'contractor'],
      select: { client: { id: true }, contractor: { id: true } },
    });
    if (!project) {
      throw new NotFoundException();
    }
    const message = new ProjectMessage();
    message.user = <any>{ id: user.id };
    message.message = body.message;
    message.project = project;

    if (body.attachment && isValidUUID(body.attachment)) {
      const attachment = await this.uploadService.getFileByIdAndUser(
        user,
        body.attachment,
      );

      if (attachment) {
        message.attachment = attachment;
      }
    }

    return await this.projectMessageRepository.save(message);
  }

  async countProjectUnreadMessages(user: User, id: string) {
    const project = await this.projectRepository.findOne({
      where: [
        { id: id, client: { id: user.id } },
        { id: id, contractor: { id: user.id } },
      ],
      relations: ['client', 'contractor'],
      select: { client: { id: true }, contractor: { id: true } },
    });
    if (!project) {
      throw new NotFoundException();
    }
    return this.projectMessageRepository.count({
      where: {
        project: { id: project.id },
        user: { id: Not(user.id) },
        read: false,
      },
    });
  }

  async completeProject(project: Project) {
    project.outcome = 'success';
    project.status = 'complete';
    const contractor = project.contractor;
    this.creditsService.addOrRemoveUserCredits(
      contractor,
      project.credits,
      `Project: ${project.need?.title ?? 'Untitled'}`,
    );
    project.credits_released = true;
    this.projectRepository.save(project);
  }

  async markProjectApproved(user: User, id: string) {
    const project = await this.projectRepository.findOne({
      where: [
        { id: id, client: { id: user.id } },
        { id: id, contractor: { id: user.id } },
      ],
      relations: ['client', 'contractor', 'need'],
      select: { client: { id: true }, contractor: { id: true } },
    });
    if (!project) {
      throw new NotFoundException();
    }

    if (project.client.id == user.id) {
      project.client_approval = true;
    } else if (project.contractor.id == user.id) {
      project.contractor_approval = true;
    }
    this.projectRepository.save(project);
    if (project.client_approval && project.contractor_approval) {
      this.completeProject(project);
    }
  }

  async markProjectNotApproved(user: User, id: string) {
    const project = await this.projectRepository.findOne({
      where: [
        { id: id, client: { id: user.id } },
        { id: id, contractor: { id: user.id } },
      ],
      relations: ['client', 'contractor', 'need'],
      select: { client: { id: true }, contractor: { id: true } },
    });
    if (!project) {
      throw new NotFoundException();
    }

    if (project.client.id == user.id) {
      project.client_approval = false;
    } else if (project.contractor.id == user.id) {
      project.contractor_approval = false;
    }
    this.projectRepository.save(project);
  }

  async markMessageAsRead(user: User, id: string) {
    const message = await this.projectMessageRepository.findOne({
      where: { id: id },
      relations: ['project'],
    });
    if (!message) throw new NotFoundException();

    const project = await this.projectRepository.findOne({
      where: [
        {
          id: message.project.id,
          client: { id: user.id },
        },
        {
          id: message.project.id,
          contractor: { id: user.id },
        },
      ],
    });
    if (!project) throw new NotFoundException();

    message.read = true;
    message.read_at = DateTime.now().toJSDate();
    this.projectMessageRepository.save(message);
  }
}
