import { IsDate, IsNotEmpty, MinDate } from 'class-validator';
import { DateTime } from 'luxon';

export class Onboarding1Dto {
  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @IsNotEmpty()
  userName!: string;

  @IsNotEmpty()
  @IsDate()
  @MinDate(() => {
    return DateTime.now().minus({ year: 13 }).toJSDate();
  })
  dateOfBirth!: string;
}
