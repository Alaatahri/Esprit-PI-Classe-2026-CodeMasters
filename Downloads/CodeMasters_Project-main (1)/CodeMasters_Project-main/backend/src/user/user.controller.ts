import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: Partial<User>) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post('login')
  async login(@Body() loginDto: { email?: string; mot_de_passe?: string }) {
    try {
      const email = loginDto?.email?.trim();
      const mot_de_passe = loginDto?.mot_de_passe;
      if (!email || !mot_de_passe) {
        return { success: false, message: 'Email et mot de passe requis' };
      }
      const user = await this.userService.login(email, mot_de_passe);
      if (!user) {
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
        createdAt: dbUser.createdAt,
      };
      return { success: true, user: safeUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Erreur lors de la connexion' };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: Partial<User>) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
