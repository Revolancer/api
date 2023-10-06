import { DateTime } from 'luxon';
import { Factory } from 'nestjs-seeder';
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
export class PortfolioPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.postfolio_posts)
  @JoinColumn()
  user!: User;

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable()
  tags: Tag[];

  @Column({ nullable: true })
  @Factory((faker) => faker?.company.catchPhrase())
  title?: string;

  @Column({ nullable: true })
  //{"time":1688397327741,"blocks":[{"id":"iIWyMLolwf","type":"paragraph","data":{"text":"asdasd"}},{"id":"tcub8FWfLL","type":"table","data":{"withHeadings":false,"content":[]}},{"id":"cUR6WNVv_2","type":"header","data":{"text":"asdasd","level":2}},{"id":"EfhRP4tlsv","type":"image","data":{"file":{"url":"https://uploads.revolancer.com/4a516774-1143-4680-988b-a12a833dbbd2/738dc6aa-7818-4930-b84c-91592ebedb6c/image245.png"},"caption":"","withBorder":false,"stretched":false,"withBackground":false}}],"version":"2.27.2"}
  @Factory((faker) => {
    const data = {
      time: DateTime.fromJSDate(
        faker?.date.past({ years: 1 }) ?? new Date(),
      ).toMillis(),
      blocks: [],
      version: '2.26.5',
    };
    for (let i = 0; i < (faker?.number.int({ min: 1, max: 13 }) ?? 3); i++) {
      if (faker?.datatype.boolean() ?? false) {
        (<any[]>data.blocks).push({
          id: faker?.string.alphanumeric(10),
          type: 'paragraph',
          data: {
            text: faker?.commerce.productDescription(),
          },
        });
      } else {
        (<any[]>data.blocks).push({
          id: faker?.string.alphanumeric(10),
          type: 'image',
          data: {
            file: {
              url: faker?.image.urlLoremFlickr(),
            },
            caption: faker?.commerce.productName(),
            withBorder: faker?.datatype.boolean() ?? false,
            stretched: faker?.datatype.boolean() ?? false,
            withBackground: faker?.datatype.boolean() ?? false,
          },
        });
      }
    }
    return data;
  })
  data?: string;

  @Column({ nullable: false, default: false })
  is_draft: boolean;

  @Column({ type: 'timestamptz' })
  @Factory((faker) => faker?.date.past({ years: 1 }))
  published_at!: Date;

  @CreateDateColumn()
  @Factory((faker) => faker?.date.past({ years: 1 }))
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
