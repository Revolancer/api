import { Message } from 'src/features/messages/entities/message.entity';
import { NeedPost } from 'src/features/need/entities/need-post.entity';
import { PortfolioPost } from 'src/features/portfolio/entities/portfolio-post.entity';
import { File } from 'src/features/upload/entities/file.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserConsent } from './userconsent.entity';
import { UserRole } from './userrole.entity';
import { Proposal } from 'src/features/need/entities/proposal.entity';
import { Project } from 'src/features/projects/entities/project.entity';
import { UserReferrer } from './userreferrer.entity';
import { LastMail } from 'src/features/mail/entities/last-mail.entity';
import { Notification } from 'src/features/notifications/entities/notification.entity';
import { Factory } from 'nestjs-seeder';
import { DateTime } from 'luxon';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  @Factory((faker) => faker?.internet.email({ provider: 'rvdevel.com' }))
  email?: string;

  @Column({ select: false })
  @Factory(
    '$argon2id$v=19$m=65536,t=3,p=4$EaXen5KJYVQ+V8xSR59Kwg$4LjnoJc5eDhGwgmJKmfuwgMwBjcoanHo6ziFLZ9aWFQ',
    //Password1!
  )
  password!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => UserRole, (role: UserRole) => role.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  roles!: UserRole[];

  @OneToMany(() => UserConsent, (consent: UserConsent) => consent.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  consents!: UserConsent[];

  @OneToMany(() => PortfolioPost, (post: PortfolioPost) => post.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  postfolio_posts!: PortfolioPost[];

  @OneToMany(() => NeedPost, (post: NeedPost) => post.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  need_posts!: NeedPost[];

  @OneToMany(() => Proposal, (post: Proposal) => post.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  proposals!: Proposal[];

  @OneToMany(() => Message, (message: Message) => message.sender, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  incoming_messages!: Message[];

  @OneToMany(() => Message, (message: Message) => message.reciever, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  outgoing_messages!: Message[];

  @OneToMany(() => Project, (project: Project) => project.client, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  outgoing_projects!: Project[];

  @OneToMany(() => Project, (project: Project) => project.contractor, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  incoming_projects!: Project[];

  @OneToMany(() => LastMail, (mail: LastMail) => mail.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  last_mails!: LastMail[];

  @OneToMany(() => File, (file: File) => file.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  files!: File[];

  @OneToMany(
    () => Notification,
    (notification: Notification) => notification.user,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  notifications!: Notification[];

  @Column({ nullable: false, default: false })
  posted_need: boolean;

  @Column({ nullable: false, default: false })
  posted_portfolio: boolean;

  @OneToOne(() => UserReferrer, (referrer: UserReferrer) => referrer.user)
  referrer?: UserReferrer;

  @CreateDateColumn()
  @Factory(
    (faker) =>
      faker?.date.between({
        from: '2022-01-01T00:00:00.000Z',
        to: DateTime.now().toJSDate(),
      }),
  )
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
