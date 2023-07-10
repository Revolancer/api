import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class StatsLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: 0 })
  newUsersDaily!: number;

  @Column({ default: 0 })
  newUsersWeekly!: number;

  @Column({ default: 0 })
  newUsersMonthly!: number;

  @Column({ default: 0 })
  newProposalsDaily!: number;

  @Column({ default: 0 })
  newProposalsWeekly!: number;

  @Column({ default: 0 })
  newProposalsMonthly!: number;

  @Column({ default: 0 })
  newPortfoliosDaily!: number;

  @Column({ default: 0 })
  newPortfoliosWeekly!: number;

  @Column({ default: 0 })
  newPortfoliosMonthly!: number;

  @Column({ default: 0 })
  newProjectsDaily!: number;

  @Column({ default: 0 })
  newProjectsWeekly!: number;

  @Column({ default: 0 })
  newProjectsMonthly!: number;

  @Column({ default: 0 })
  newNeedsDaily!: number;

  @Column({ default: 0 })
  newNeedsWeekly!: number;

  @Column({ default: 0 })
  newNeedsMonthly!: number;

  @Column({ default: 0 })
  activeUsersDaily!: number;

  @Column({ default: 0 })
  activeUsersWeekly!: number;

  @Column({ default: 0 })
  activeUsersMonthly!: number;

  @CreateDateColumn()
  created_at!: Date;
}
