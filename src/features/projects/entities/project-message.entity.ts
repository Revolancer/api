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
import { Project } from './project.entity';

@Entity()
export class ProjectMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Project)
  @JoinColumn()
  project!: Project;

  @ManyToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column()
  message!: string;

  @Column({ nullable: false, default: false })
  read: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  read_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
