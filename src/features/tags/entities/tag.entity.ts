import {
  Entity,
  Tree,
  Column,
  PrimaryGeneratedColumn,
  TreeChildren,
  TreeParent,
} from 'typeorm';

@Entity()
@Tree('closure-table')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  text: string;

  @TreeChildren()
  children: Tag[];

  @TreeParent()
  parent: Tag;
}
