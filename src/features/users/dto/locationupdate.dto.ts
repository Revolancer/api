import { IsNotEmpty } from 'class-validator';

export class LocationUpdateDto {
  @IsNotEmpty()
  location!: { label: string; value: { place_id: string } };
}
