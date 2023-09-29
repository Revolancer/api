import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTaglineDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  tagline: string;
}
