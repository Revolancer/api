import { NeedPost } from 'src/features/need/entities/need-post.entity';
import { Proposal } from 'src/features/need/entities/proposal.entity';
import { User } from 'src/features/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ProjectMessage } from './project-message.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn()
  client!: User;

  @ManyToOne(() => User)
  @JoinColumn()
  contractor!: User;

  @Column({ default: 'active' })
  status!: 'active' | 'complete';

  @Column({ nullable: true })
  outcome?: 'success' | 'cancelled';

  @Column()
  credits!: number;

  @Column({ default: false })
  credits_released!: boolean;

  @OneToOne(() => NeedPost)
  @JoinColumn()
  need!: NeedPost;

  @OneToOne(() => Proposal)
  @JoinColumn()
  proposal!: Proposal;

  @OneToMany(
    () => ProjectMessage,
    (message: ProjectMessage) => message.project,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  messages!: ProjectMessage[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
