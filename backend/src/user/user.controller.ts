import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterExpertDto } from './dto/register-expert.dto';
import { RegisterLivreurDto } from './dto/register-livreur.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { expertCvMulterOptions } from './expert-cv-upload';
import { livreurCinMulterOptions } from './livreur-cin-upload';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Inscription expert : multipart (champs + fichier CV PDF/DOCX, max 5 Mo). */
  @Post('expert')
  @UseInterceptors(FileInterceptor('cv', expertCvMulterOptions))
  registerExpert(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: RegisterExpertDto,
  ) {
    if (!file) {
      throw new BadRequestException(
        'CV obligatoire : fichier PDF ou DOCX, 5 Mo maximum.',
      );
    }
    const name = file.filename || file.path?.split(/[/\\]/).pop();
    if (!name) {
      throw new BadRequestException('Enregistrement du CV impossible.');
    }
    const cvRel = `/uploads/expert-cv/${name}`;
    return this.userService.register({
      nom: body.nom,
      email: body.email,
      mot_de_passe: body.mot_de_passe,
      telephone: body.telephone,
      role: 'expert',
      domaine_expertise: body.domaine_expertise,
      experience_annees: body.experience_annees,
      niveau_etudes: body.niveau_etudes,
      linkedin_url: body.linkedin_url,
      cv_document_path: cvRel,
    });
  }

  /** Inscription livreur : multipart (champs + CIN / permis JPG/PNG/PDF, max 3 Mo). */
  @Post('livreur')
  @UseInterceptors(FileInterceptor('cin_permis', livreurCinMulterOptions))
  registerLivreur(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: RegisterLivreurDto,
  ) {
    if (!file) {
      throw new BadRequestException(
        'CIN / permis obligatoire : JPG, PNG ou PDF, 3 Mo maximum.',
      );
    }
    const name = file.filename || file.path?.split(/[/\\]/).pop();
    if (!name) {
      throw new BadRequestException('Enregistrement du document impossible.');
    }
    const cinRel = `/uploads/livreur-cin/${name}`;
    return this.userService.register({
      nom: body.nom,
      email: body.email,
      mot_de_passe: body.mot_de_passe,
      telephone: body.telephone,
      role: 'livreur',
      livreur_transport: body.moyen_transport,
      zones_livraison: body.zones_livraison,
      livreur_disponibilite: body.livreur_disponibilite,
      cin_permis_document_path: cinRel,
    });
  }

  @Post()
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Get()
  findAll() {
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
        domaine_expertise: dbUser.domaine_expertise,
        niveau_etudes: dbUser.niveau_etudes,
        cv_document_path: dbUser.cv_document_path,
        linkedin_url: dbUser.linkedin_url,
        livreur_transport: dbUser.livreur_transport,
        zones_livraison: dbUser.zones_livraison,
        cin_permis_document_path: dbUser.cin_permis_document_path,
        livreur_disponibilite: dbUser.livreur_disponibilite,
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
