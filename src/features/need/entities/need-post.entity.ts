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
} from 'typeorm';

@Entity()
export class NeedPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.need_posts)
  @JoinColumn()
  user!: User;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  data?: string;

  @Column({ nullable: false, default: false })
  is_draft: boolean;

  @Column({ type: 'timestamptz' })
  published_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
