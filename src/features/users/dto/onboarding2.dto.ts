import { IsNotEmpty } from 'class-validator';

export class Onboarding2Dto {
  @IsNotEmpty()
  experience!: number;

  @IsNotEmpty()
  currency!: string;

  @IsNotEmpty()
  hourlyRate!: number;
}
