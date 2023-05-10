import {
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsDateString,
} from 'class-validator';

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
  @IsDateString()
  unpublish_at?: Date;
}
