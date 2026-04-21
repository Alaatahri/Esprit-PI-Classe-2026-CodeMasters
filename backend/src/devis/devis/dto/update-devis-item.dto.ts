import { PartialType } from '@nestjs/mapped-types';
import { CreateDevisItemDto } from './create-devis-item.dto';

export class UpdateDevisItemDto extends PartialType(CreateDevisItemDto) {}
