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

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.outgoing_messages)
  @JoinColumn()
  sender!: User;

  @ManyToOne(() => User, (user: User) => user.incoming_messages)
  @JoinColumn()
  reciever!: User;

  @Column({ nullable: true })
  body?: string;

  @Column({ nullable: false, default: false })
  read: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  read_at?: Date;

  @Column({ nullable: false, default: false })
  admin_hidden: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
