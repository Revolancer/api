import { IsNotEmpty } from 'class-validator';

export class ChangeExperienceDto {
  @IsNotEmpty()
  experience!: number;
}
