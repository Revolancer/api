import { IsNotEmpty } from 'class-validator';

export class SendProjectMessageDto {
  @IsNotEmpty()
  message!: string;
  attachment?: string;
}
