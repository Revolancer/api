import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAboutDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  about: string;
}
