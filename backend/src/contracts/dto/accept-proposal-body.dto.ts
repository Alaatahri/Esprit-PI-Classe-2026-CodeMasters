import { IsOptional, IsString } from 'class-validator';

export class AcceptProposalBodyDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  expertName?: string;
}
