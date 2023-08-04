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
import { Factory } from 'nestjs-seeder';
import { DateTime } from 'luxon';

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column({ nullable: true })
  @Factory((faker) => faker?.person.firstName())
  first_name?: string;

  @Column({ nullable: true })
  @Factory((faker) => faker?.person.lastName())
  last_name?: string;

  @Column({ nullable: true })
  @Factory(
    (faker) =>
      faker?.date.between({
        from: '1940-01-01T00:00:00.000Z',
        to: '2004-01-01T00:00:00.000Z',
      }),
  )
  date_of_birth?: Date;

  @Column({ nullable: true })
  @Factory(
    (faker) =>
      faker?.string.alphanumeric({
        casing: 'lower',
        length: { max: 15, min: 6 },
      }),
  )
  slug?: string;

  @Column({ nullable: true })
  @Factory((faker) => faker?.number.int({ max: 10, min: 0 }))
  experience?: number;

  @Column({ nullable: true })
  @Factory(
    (faker) =>
      ['GBP', 'EUR', 'USD'][faker?.number.int({ max: 2, min: 0 }) ?? 0],
  )
  currency?: string;

  @Column({ nullable: true })
  @Factory((faker) => faker?.number.int({ max: 200, min: 10 }))
  hourly_rate?: number;

  @Column({ nullable: true })
  @Factory(
    (faker) =>
      faker?.image.urlLoremFlickr({
        width: 480,
        height: 480,
        category: 'human',
      }),
  )
  profile_image?: string;

  @Column({ nullable: true })
  @Factory((faker) => faker?.location.timeZone())
  timezone?: string;

  @ManyToMany(() => Tag)
  @JoinTable()
  skills: Tag[];

  @Column({ nullable: true })
  @Factory(4)
  onboardingStage?: number;

  @Column({ nullable: true })
  @Factory((faker) => faker?.lorem.sentence({ min: 3, max: 5 }))
  tagline?: string;

  @Column({ nullable: true })
  @Factory((faker) => faker?.lorem.sentences({ min: 2, max: 6 }))
  about?: string;

  @Column({ default: false })
  @Factory((faker) => faker?.datatype.boolean())
  checklist_complete: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  @Factory(
    (faker) =>
      faker?.date.between({
        from: '2023-01-01T00:00:00.000Z',
        to: DateTime.now().toJSDate(),
      }),
  )
  last_active?: Date;

  @CreateDateColumn()
  @Factory(
    (faker) =>
      faker?.date.between({
        from: '2022-01-01T00:00:00.000Z',
        to: DateTime.now().toJSDate(),
      }),
  )
  created_at!: Date;

  @UpdateDateColumn()
  @Factory(
    (faker) =>
      faker?.date.between({
        from: '2022-01-01T00:00:00.000Z',
        to: DateTime.now().toJSDate(),
      }),
  )
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
