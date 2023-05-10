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
} from 'typeorm';
import { NeedPost } from './need-post.entity';

@Entity()
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.proposals)
  @JoinColumn()
  user!: User;

  @ManyToOne(() => NeedPost, (need: NeedPost) => need.proposals)
  @JoinColumn()
  need!: NeedPost;

  @Column({ nullable: false })
  message!: string;

  @Column({ nullable: false, default: 1 })
  estimate_hours!: number;

  @Column({ nullable: false, default: 1 })
  price!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
