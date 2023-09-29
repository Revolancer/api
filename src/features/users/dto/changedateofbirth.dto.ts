import { IsNotEmpty } from 'class-validator';

export class ChangeDateOfBirthDto {
  @IsNotEmpty()
  date_of_birth!: Date;
}
