import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { UserConsent } from './userconsent.entity';
import { UserRole } from './userrole.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column()
  password!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => UserRole, (role: UserRole) => role.user, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  roles!: UserRole[];

  @OneToMany(() => UserConsent, (consent: UserConsent) => consent.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  consents!: UserConsent[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
