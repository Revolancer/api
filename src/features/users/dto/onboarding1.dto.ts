import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, MaxDate } from 'class-validator';
import { DateTime } from 'luxon';

export class Onboarding1Dto {
  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @IsNotEmpty()
  userName!: string;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MaxDate(
    () => {
      return DateTime.now().minus({ year: 13 }).toJSDate();
    },
    {
      message: `Date of birth must be after ${DateTime.now()
        .minus({ year: 13 })
        .toJSDate()
        .toISOString()}`,
    },
  )
  dateOfBirth!: Date;
}
