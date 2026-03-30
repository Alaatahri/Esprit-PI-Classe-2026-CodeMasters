import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';

/**
 * Profils terrain : même collection users, exposés ici pour le front (proxy Vite → port 3001).
 * Le matching Socket / Express reste sur le port 5050 si utilisé.
 */
@Controller('workers')
export class WorkersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  list() {
    return this.userService.findFieldWorkers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const w = await this.userService.findFieldWorkerById(id);
    if (!w) throw new NotFoundException('Profil introuvable');
    return w;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const w = await this.userService.patchFieldWorker(id, body);
    if (!w) throw new NotFoundException('Profil introuvable');
    return w;
  }
}
