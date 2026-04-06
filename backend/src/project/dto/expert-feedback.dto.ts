import { IsOptional, IsString } from 'class-validator';

export class ExpertFeedbackDto {
  @IsOptional()
  @IsString()
  text?: string;
}
