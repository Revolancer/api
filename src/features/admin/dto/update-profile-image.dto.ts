import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProfileImageDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  profileImage!: string;
}
