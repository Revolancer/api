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
} from 'typeorm';
import { UserConsent } from './userconsent.entity';
import { UserRole } from './userrole.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
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

  @OneToMany(() => File, (file: File) => file.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  files!: File[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
