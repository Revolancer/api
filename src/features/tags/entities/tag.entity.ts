import { Factory } from 'nestjs-seeder';
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
  @Factory((faker) => faker?.commerce.productName())
  text: string;

  @TreeChildren()
  children: Tag[];

  @TreeParent()
  parent: Tag;
}
