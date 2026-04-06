import { IsMongoId, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  toUserId: string;

  @IsString()
  @MinLength(1)
  body: string;
}
