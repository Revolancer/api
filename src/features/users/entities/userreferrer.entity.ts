import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserReferrer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, (user: User) => user.referrer)
  @JoinColumn()
  user!: User;

  @Column({ nullable: true })
  referrer?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
