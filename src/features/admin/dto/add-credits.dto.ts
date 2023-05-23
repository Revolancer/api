import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class AddCreditsDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  amount!: number;

  @IsNotEmpty()
  reason!: string;

  @IsNotEmpty()
  recipient!: string;
}
