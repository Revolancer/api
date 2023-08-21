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
import { Factory } from 'nestjs-seeder';
import { DateTime } from 'luxon';

@Entity()
export class UserSocials {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column('text', { array: true })
  @Factory((faker) => {
    const numLinks = faker?.number.int({ min: 0, max: 8 }) ?? 0;
    const sampleLinks = [
      'https://facebook.com/example',
      'https://instagram.com/example',
      'https://twitter.com/example',
      'https://example.org',
      'https://youtube.com/example',
      'https://threads.com/example',
      'https://unsplash.com/example',
      'https://behance.com/example',
    ];
    if (numLinks == 0) return [];
    return sampleLinks.slice(numLinks - 1);
  })
  links: string[];

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
