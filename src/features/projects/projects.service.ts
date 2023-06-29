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
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { LastMail } from '../mail/entities/last-mail.entity';
import { Cron } from '@nestjs/schedule';
import { RedlockService } from '@anchan828/nest-redlock';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly redlock: RedlockService,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMessage)
    private projectMessageRepository: Repository<ProjectMessage>,
    private creditsService: CreditsService,
    private needService: NeedService,
    private uploadService: UploadService,
    private mailService: MailService,
    private usersService: UsersService,
    @InjectRepository(LastMail)
    private lastMailRepository: Repository<LastMail>,
    private notificationsService: NotificationsService,
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
    const contractor = await this.usersService.findOne(proposal.user.id);
    if (contractor) {
      this.mailService.scheduleMail(contractor, 'proposal_accepted', {
        need: need,
        project: savedProject,
        someone: user,
      });
      this.notificationsService.createOrUpdate(
        contractor,
        `Your proposal on "${need.title}" was accepted!`,
        `project-new-${savedProject.id}`,
        `/project/${savedProject.id}`,
      );
    }
    this.notificationsService.createOrUpdate(
      user,
      `Congratulations, your project "${need.title}" is now under way!`,
      `project-new-${savedProject.id}`,
      `/project/${savedProject.id}`,
    );
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

  async getCompleteProjects(user: User) {
    return this.projectRepository.find({
      where: [
        { client: { id: user.id }, status: 'complete' },
        { contractor: { id: user.id }, status: 'complete' },
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
      relations: ['user', 'attachment'],
      select: { user: { id: true } },
      order: { created_at: 'ASC' },
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
      relations: ['client', 'contractor', 'need'],
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
    this.notificationsService.createOrUpdate(
      project.client.id == user.id ? project.contractor : project.client,
      `You have a new message in the ${project.need.title} project`,
      `project-message-${project.id}`,
      `/project/${project.id}`,
    );

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
    const loadedContractor = await this.usersService.findOne(
      project.contractor.id,
    );
    if (loadedContractor) {
      this.mailService.scheduleMail(
        loadedContractor,
        'project_complete_contractor',
        {
          need: project.need,
          project: project,
        },
      );
      this.notificationsService.createOrUpdate(
        loadedContractor,
        `Congratulations, your project "${project.need.title}" is complete!`,
        `project-new-${project.id}`,
        `/project/${project.id}`,
      );
    }
    const loadedClient = await this.usersService.findOne(project.client.id);
    if (loadedClient) {
      this.mailService.scheduleMail(loadedClient, 'project_complete_client', {
        need: project.need,
        project: project,
      });
      this.notificationsService.createOrUpdate(
        loadedClient,
        `Congratulations, your project "${project.need.title}" is complete!`,
        `project-new-${project.id}`,
        `/project/${project.id}`,
      );
    }
  }

  /**
   * Cancel an active project because one participant is being deleted
   * @param project The project to cancel
   * @param deletedUser The user account being deleted
   */
  async cancelProjectForDeletedUser(project: Project, deletedUser: User) {
    project.outcome = 'cancelled';
    project.status = 'complete';
    const contractor = project.contractor;
    const client = project.client;
    //Find user who is not being deleted
    const remainingUser = deletedUser.id == client.id ? contractor : client;
    this.creditsService.addOrRemoveUserCredits(
      remainingUser,
      project.credits,
      `Project cancelled: ${project.need?.title ?? 'Untitled'}`,
    );
    project.credits_released = true;
    this.projectRepository.save(project);
    const loadedUser = await this.usersService.findOne(remainingUser.id);
    if (loadedUser) {
      //TODO: We need an email for 'project cancelled, other user closed their account'
      /*
      this.mailService.scheduleMail(
        loadedUser,
        'project_complete_contractor',
        {
          need: project.need,
          project: project,
        },
      );
      */
      this.notificationsService.createOrUpdate(
        loadedUser,
        `Unfortunately, your project "${project.need.title}" was cancelled due to the other user's account being closed`,
        `project-new-${project.id}`,
        `/project/${project.id}`,
      );
    }
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
      this.notificationsService.createOrUpdate(
        project.contractor,
        `Your project ${project.need.title} is awaiting your approval`,
        `project-approval-${project.id}`,
        `/project/${project.id}`,
      );
    } else if (project.contractor.id == user.id) {
      project.contractor_approval = true;
      this.notificationsService.createOrUpdate(
        project.client,
        `Your project ${project.need.title} is awaiting your approval`,
        `project-approval-${project.id}`,
        `/project/${project.id}`,
      );
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
      this.notificationsService.deleteByKey(
        project.contractor,
        `project-approval-${project.id}`,
      );
    } else if (project.contractor.id == user.id) {
      project.contractor_approval = false;
      this.notificationsService.deleteByKey(
        project.client,
        `project-approval-${project.id}`,
      );
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

  async scheduleUnreadMessagesProjectEmail(
    user: User,
    project: Project,
    someone: User,
  ) {
    const lastUnreadMessagesEmail = await this.lastMailRepository.findOne({
      where: {
        user: { id: user.id },
        mailout: `unread_messages_${project.id}`,
      },
    });
    let shouldMail = true;
    const userLastActive = await this.usersService.getLastActive(user);
    if (lastUnreadMessagesEmail) {
      if (
        DateTime.fromJSDate(lastUnreadMessagesEmail.last_mail).plus({
          day: 3,
        }) > DateTime.now()
      ) {
        shouldMail = false;
        if (
          userLastActive >
          DateTime.fromJSDate(lastUnreadMessagesEmail.last_mail)
        ) {
          shouldMail = true;
        }
      }
    }
    if (userLastActive.plus({ minute: 30 }) > DateTime.now()) {
      shouldMail = false;
    }
    if (!shouldMail) {
      return;
    }

    this.mailService.scheduleMail(user, 'project_unread_messages', {
      someone: someone,
      project: project,
    });

    if (lastUnreadMessagesEmail) {
      lastUnreadMessagesEmail.last_mail = DateTime.now().toJSDate();
      this.lastMailRepository.save(lastUnreadMessagesEmail);
    } else {
      const messageSent = new LastMail();
      messageSent.last_mail = DateTime.now().toJSDate();
      messageSent.mailout = `unread_messages_${project.id}`;
      messageSent.user = user;
      this.lastMailRepository.save(messageSent);
    }
  }

  /**
   * Send an email to all users with unread messages greater than 12 hours old
   * If they have recieved this email since they were last active, do not resend it
   */
  @Cron('27 */15 * * * *')
  async alertUsersWithUnreadMessages() {
    await this.redlock.using(
      ['unread-messages-email'],
      30000,
      async (signal) => {
        if (signal.aborted) {
          throw signal.error;
        }

        const alertTime = DateTime.now().minus({ hour: 1 }).toJSDate();
        const unreads = await this.projectMessageRepository
          .createQueryBuilder()
          .select('message')
          .from(ProjectMessage, 'message')
          .where('message.read = false')
          .andWhere('message.created_at < :time', { time: alertTime })
          .loadAllRelationIds()
          .distinctOn(['message.projectId', 'message.userId'])
          .getMany();
        for (const unread of unreads) {
          const project = await this.projectRepository.findOne({
            where: {
              id: unread.project as unknown as string,
            },
            relations: ['contractor', 'client'],
          });
          if (project) {
            const reciever =
              project?.contractor.id == (unread.user as unknown as string)
                ? project.client
                : project.contractor;
            const sender =
              project?.contractor.id == (unread.user as unknown as string)
                ? project.contractor
                : project.client;
            this.scheduleUnreadMessagesProjectEmail(reciever, project, sender);
          }
        }
      },
    );
  }
}
