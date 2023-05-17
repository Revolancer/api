import { IsEmail } from 'class-validator';

export class EmailUpdateDto {
  @IsEmail()
  email!: string;
}
