import { IsNotEmpty } from 'class-validator';

export class ImportUsersDto {
  @IsNotEmpty()
  userCsv!: string;
}
