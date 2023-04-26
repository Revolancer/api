import {
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
} from 'class-validator';

class Tag {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  text!: string;
}

export class Onboarding3Dto {
  @IsNotEmpty()
  timezone!: string;

  @IsNotEmpty()
  profileImage!: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(20)
  skills!: Tag[];
}
