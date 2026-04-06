import { PartialType } from '@nestjs/mapped-types';
import { CreateSuiviProjectDto } from './create-suivi-project.dto';

export class UpdateSuiviProjectDto extends PartialType(CreateSuiviProjectDto) {}
