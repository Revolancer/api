import { ArrayMinSize, ArrayMaxSize, IsArray } from 'class-validator';

export class SocialsUpdateDto {
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  links!: string[];
}
