import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateProposalDto {
  @IsNotEmpty()
  message!: string;

  @IsNotEmpty()
  @Min(1)
  @Max(100)
  @IsInt()
  estHours!: number;

  @IsNotEmpty()
  @Min(10)
  @Max(10000)
  price!: number;
}
