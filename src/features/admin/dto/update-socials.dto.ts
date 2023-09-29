import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class UpdateSocialsDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  links!: string[];
}
