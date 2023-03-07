import { IsNotEmpty } from 'class-validator';

export class UsernameCheckDto {
  @IsNotEmpty()
  userName!: string;
}
