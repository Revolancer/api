import { IsNotEmpty } from 'class-validator';

export class StoreFileDto {
  @IsNotEmpty()
  fileName!: string;
}
