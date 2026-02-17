import { Controller, Get } from '@nestjs/common';
import { ProjectService } from '../project/project.service';
import { UserService } from '../user/user.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getData() {
    const [projects, users] = await Promise.all([
      this.projectService.findAll(100),
      this.userService.findAll(100),
    ]);
    return { projects, users };
  }
}
