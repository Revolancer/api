import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLocationDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  location!: { label: string; value: { place_id: string } };
}
