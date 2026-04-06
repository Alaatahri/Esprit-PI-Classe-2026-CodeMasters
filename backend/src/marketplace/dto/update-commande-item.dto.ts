import { PartialType } from '@nestjs/mapped-types';
import { CreateCommandeItemDto } from './create-commande-item.dto';

export class UpdateCommandeItemDto extends PartialType(CreateCommandeItemDto) {}
