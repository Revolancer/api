import {
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsString,
} from 'class-validator';

class Tag {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  text!: string;
}

export class UpdateSkillsDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(20)
  skills!: Tag[];
}
