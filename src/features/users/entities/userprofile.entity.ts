import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column()
  first_name?: string;

  @Column()
  last_name?: string;

  @Column()
  date_of_birth?: Date;

  @Column()
  slug?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
