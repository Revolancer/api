import { IsNotEmpty } from 'class-validator';

export class ChangeRateDto {
  @IsNotEmpty()
  currency!: string;

  @IsNotEmpty()
  hourlyRate!: number;
}
