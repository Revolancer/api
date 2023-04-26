import { IsNotEmpty } from 'class-validator';

export class TimezoneUpdateDto {
  @IsNotEmpty()
  timezone!: string;
}
