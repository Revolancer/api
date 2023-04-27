import { IsNotEmpty } from 'class-validator';

export class ProfileImageUpdateDto {
  @IsNotEmpty()
  profileImage!: string;
}
