import { IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  body!: string;
  attachment?: string;
}
