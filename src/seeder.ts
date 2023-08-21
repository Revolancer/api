import { seeder } from 'nestjs-seeder';
import { UsersSeeder } from './features/users/entities/seeders/users.seeder';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './features/users/entities/user.entity';
import { UserProfile } from './features/users/entities/userprofile.entity';
import { DBConfigModule } from './config/db/config.module';
import { DBConfigService } from './config/db/config.service';
import { UserRole } from './features/users/entities/userrole.entity';
import { UserConsent } from './features/users/entities/userconsent.entity';
import { UserReferrer } from './features/users/entities/userreferrer.entity';
import { PortfolioPost } from './features/portfolio/entities/portfolio-post.entity';
import { NeedPost } from './features/need/entities/need-post.entity';
import { Tag } from './features/tags/entities/tag.entity';
import { Proposal } from './features/need/entities/proposal.entity';
import { Message } from './features/messages/entities/message.entity';
import { Project } from './features/projects/entities/project.entity';
import { ProjectMessage } from './features/projects/entities/project-message.entity';
import { File } from './features/upload/entities/file.entity';
import { LastMail } from './features/mail/entities/last-mail.entity';
import { Notification } from './features/notifications/entities/notification.entity';
import { TagsSeeder } from './features/tags/seeders/tags.seeder';
import { PortfoliosSeeder } from './features/portfolio/seeders/portfolios.seeder';
import { UserSocials } from './features/users/entities/usersocials.entity';

seeder({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [DBConfigModule],
      inject: [DBConfigService],
      useFactory: async (dbConfig: DBConfigService) => ({
        type: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.db,
        autoLoadEntities: true,
        synchronize: dbConfig.synchronise,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      UserRole,
      UserConsent,
      UserProfile,
      UserReferrer,
      UserSocials,
      PortfolioPost,
      NeedPost,
      Tag,
      Proposal,
      Message,
      Project,
      ProjectMessage,
      File,
      LastMail,
      Notification,
    ]),
  ],
}).run([TagsSeeder, UsersSeeder, PortfoliosSeeder]);
