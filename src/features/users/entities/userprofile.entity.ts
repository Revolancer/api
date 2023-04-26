import { Tag } from 'src/features/tags/entities/tag.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column({ nullable: true })
  first_name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ nullable: true })
  date_of_birth?: Date;

  @Column({ nullable: true })
  slug?: string;

  @Column({ nullable: true })
  experience?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  hourly_rate?: number;

  @Column({ nullable: true })
  profile_image?: string;

  @Column({ nullable: true })
  timezone?: string;

  @ManyToMany(() => Tag)
  @JoinTable()
  skills: Tag[];

  @Column({ nullable: true })
  onboardingStage?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
