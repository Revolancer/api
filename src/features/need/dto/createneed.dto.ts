import {
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsOptional,
  MinDate,
} from 'class-validator';
import { DateTime } from 'luxon';

class Tag {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  text!: string;
}

export class CreatePostDto {
  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  tags!: Tag[];

  @IsNotEmpty()
  data!: string;

  @IsOptional()
  @IsDate()
  @MinDate(() => DateTime.now().toJSDate())
  unpublish_at?: Date;
}
