import { IsNotEmpty } from 'class-validator';

export class CreateTagDto {
  parent?: string;

  @IsNotEmpty()
  text!: string;
}
