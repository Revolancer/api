import { IsNotEmpty } from 'class-validator';

export class NewProjectDto {
  @IsNotEmpty()
  need!: string;

  @IsNotEmpty()
  proposal!: string;
}
