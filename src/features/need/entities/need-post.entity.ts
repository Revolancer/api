import { Tag } from 'src/features/tags/entities/tag.entity';
import { User } from 'src/features/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity()
export class NeedPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.need_posts)
  @JoinColumn()
  user!: User;

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable()
  tags: Tag[];

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  data?: string;

  @Column({ nullable: false, default: false })
  is_draft: boolean;

  @OneToMany(() => Proposal, (post: Proposal) => post.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  proposals!: Proposal[];

  @Column({ type: 'timestamptz' })
  published_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  unpublish_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
