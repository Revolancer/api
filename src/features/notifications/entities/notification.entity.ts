import { User } from 'src/features/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique('user-key', ['user', 'key'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.notifications)
  @JoinColumn()
  user!: User;

  @Column()
  message!: string;

  @Column()
  url!: string;

  @Column()
  key!: string;

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
