import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('debug-users')
  async debugUsers() {
    return this.userService.findAll();
  }


  @Post()
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Get()
  findAll(@Query('role') role?: string, @Query('artisanId') artisanId?: string) {
    if (role === 'client' && artisanId) {
      return this.userService.findClientsByArtisan(artisanId);
    }
    if (role) return this.userService.findAllByRole(role);
    return this.userService.findAll();
  }

  @Get('public/workers')
  findPublicWorkers() {
    return this.userService.findPublicWorkers();
  }

  @Get('public/:id/profile')
  getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const email = loginDto.email.trim();
      const mot_de_passe = loginDto.mot_de_passe;
      const user = await this.userService.login(email, mot_de_passe);
      if (!user) {
        console.log(`[DEBUG] Login failed for ${email}. Checking if user exists...`);
        const exists = await this.userService.findByEmail(email);
        if (!exists) {
          console.log(`[DEBUG] User ${email} does NOT exist in DB.`);
        } else {
          console.log(`[DEBUG] User ${email} exists but password or verification failed.`);
        }
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }
      // Retourner un objet sérialisable (évite 500 avec ObjectId etc.)
      // On caste en any ici car les champs _id/createdAt viennent du document Mongo
      const dbUser: any = user;
      const safeUser = {
        _id: dbUser._id?.toString?.() ?? dbUser._id,
        nom: dbUser.nom,
        email: dbUser.email,
        role: dbUser.role,
        telephone: dbUser.telephone,
        specialite: dbUser.specialite,
        experience_annees: dbUser.experience_annees,
        zones_travail: dbUser.zones_travail,
        createdAt: dbUser.createdAt,
      };
      return { success: true, user: safeUser };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Login error:', error);
      return { success: false, message: 'Erreur lors de la connexion' };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
