import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class NameUpdateDto {
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  first_name!: string;

  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  last_name!: string;
}
