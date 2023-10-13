import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique('content', ['otherId', 'contentType'])
export class ContentIndex {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { default: '' })
  otherId!: string;

  @Column('text', { default: '' })
  contentType!: string;

  @Column('text', { default: '' })
  title!: string;

  @Column('text', { default: '' })
  body!: string;

  @Column('text', { array: true })
  tagIds!: string[];

  @Column({ type: 'timestamptz', default: 'NOW()' })
  content_created_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
