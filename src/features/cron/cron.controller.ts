import { Controller, Get } from '@nestjs/common';
import { StatsService } from '../admin/stats.service';
import { CreditsService } from '../credits/credits.service';
import { UsersService } from '../users/users.service';
import { MessageService } from '../messages/message.service';
import { ProjectsService } from '../projects/projects.service';

@Controller('cron')
export class CronController {
  constructor(
    private statsService: StatsService,
    private creditsService: CreditsService,
    private usersService: UsersService,
    private messageService: MessageService,
    private projectsService: ProjectsService,
  ) {}

  @Get('capture-spot-stats')
  captureSpotStats() {
    this.statsService.captureSpotStats();
  }

  @Get('monthly-bonus-credits')
  monthlyBonusCredits() {
    this.creditsService.assignMonthlyBonusCredits();
  }

  @Get('needs-prompt-email')
  needsPromptEmail() {
    this.usersService.checkIfUserHasNeeds();
  }

  @Get('portfolio-prompt-email')
  portfolioPromptEmail() {
    this.usersService.checkIfUserHasPortfolio();
  }

  @Get('unread-direct-messages')
  unreadDirectMessages() {
    this.messageService.alertUsersWithUnreadMessages();
  }

  @Get('unread-project-messages')
  unreadProjectMessages() {
    this.projectsService.alertUsersWithUnreadMessages();
  }
}
