import { IsNotEmpty } from 'class-validator';

export class PasswordUpdateDto {
  @IsNotEmpty()
  password!: string;

  @IsNotEmpty()
  newPassword1!: string;

  @IsNotEmpty()
  newPassword2!: string;
}
