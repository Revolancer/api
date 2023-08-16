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
  timezone?: string;
  location?: { label: string; value: { place_id: string } };

  @IsNotEmpty()
  profileImage!: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(20)
  skills!: Tag[];
}
