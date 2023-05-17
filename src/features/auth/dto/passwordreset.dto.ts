import { IsNotEmpty } from 'class-validator';

export class PasswordResetDto {
  @IsNotEmpty()
  password!: string;

  @IsNotEmpty()
  repeatpassword!: string;

  @IsNotEmpty()
  resetKey!: string;
}
