import { IsIn } from 'class-validator';

export class RespondMatchingDto {
  @IsIn(['accepted', 'refused'])
  response: 'accepted' | 'refused';
}
