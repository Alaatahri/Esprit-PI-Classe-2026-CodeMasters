import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { extname } from 'path';
import { ProjectService } from './project.service';
import { Project } from './schemas/project.schema';
import { MatchingService } from '../matching/matching.service';
import { AlbumBodyDto } from './dto/album-body.dto';
import { ApplyProjectDto } from './dto/apply-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ExpertFeedbackDto } from './dto/expert-feedback.dto';
import { ExpertPhotosDto } from './dto/expert-photos.dto';
import { RateProjectDto } from './dto/rate-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UploadKindBodyDto } from './dto/upload-kind-body.dto';
import { ExpertManualProgressDto } from './dto/expert-manual-progress.dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly matchingService: MatchingService,
  ) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    const created = await this.projectService.create(
      createProjectDto as unknown as Partial<Project>,
    );
    // Déclenchement automatique du matching pour alimenter "Nouveaux projets" côté expert.
    try {
      const id =
        (created as any)?._id?.toString?.() ??
        String((created as any)?._id ?? '');
      if (id) {
        await this.matchingService.triggerMatching(id);
      }
    } catch {
      // Best effort: ne bloque pas la création si le matching échoue
    }
    return created;
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get('public/showcase')
  showcaseProjects() {
    return this.projectService.findShowcaseProjects(24);
  }

  @Get('public/showcase/:id')
  showcaseProjectById(@Param('id') id: string) {
    return this.projectService.findPublicShowcaseById(id);
  }

  /** Expert assigné : ajoute des URLs aux albums avant/après (en-tête x-user-id = id expert). */
  @Post(':id/expert/photos')
  appendExpertPhotos(
    @Param('id') id: string,
    @Body() body: ExpertPhotosDto,
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = expertIdHeader?.trim();
    if (!expertId) {
      throw new BadRequestException(
        'En-tête x-user-id requis (identifiant de l’expert connecté).',
      );
    }
    const urls = Array.isArray(body?.urls) ? body.urls : [];
    const album = body?.album === 'avant' ? 'avant' : 'apres';
    return this.projectService.appendExpertProjectPhotos(id, expertId, {
      urls,
      album,
    });
  }

  /**
   * Expert assigné : upload des images (fichiers) vers /uploads, puis ajout aux albums avant/après.
   * Champs multipart attendus: album ('avant'|'apres'), files[] (champ: 'files')
   */
  @Post(':id/expert/photos/upload')
  @UseInterceptors(
    FilesInterceptor('files', 12, {
      storage: diskStorage({
        destination: 'public/uploads/projects',
        filename: (_req, file, cb) => {
          const safeExt =
            extname(file.originalname || '').slice(0, 10) || '.jpg';
          const name = `p_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok =
          typeof file.mimetype === 'string' &&
          file.mimetype.startsWith('image/');
        cb(
          ok
            ? null
            : new BadRequestException('Seules les images sont autorisées.'),
          ok,
        );
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB / image
    }),
  )
  async uploadExpertPhotos(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: any[],
    @Body(new DefaultValuePipe({})) body: AlbumBodyDto,
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = expertIdHeader?.trim();
    if (!expertId) {
      throw new BadRequestException(
        'En-tête x-user-id requis (identifiant de l’expert connecté).',
      );
    }
    const album = body?.album === 'avant' ? 'avant' : 'apres';
    const list = Array.isArray(files) ? files : [];
    if (list.length === 0) {
      throw new BadRequestException(
        'Aucun fichier reçu (champ multipart: files).',
      );
    }

    const base = `${req.protocol}://${req.get('host')}`;
    const urls = list
      .map((f) => String(f?.filename || '').trim())
      .filter(Boolean)
      .map(
        (filename) =>
          `${base}/uploads/projects/${encodeURIComponent(filename)}`,
      );

    return this.projectService.appendExpertProjectPhotos(id, expertId, {
      urls,
      album,
    });
  }

  /**
   * Upload de fichiers projet (plans/docs) ou photos du site au moment de la demande.
   * - kind: 'attachment' | 'site_photo'
   * - champ fichiers: 'files'
   * Ajoute les URLs dans `pieces_jointes` ou `photos_site`.
   */
  @Post(':id/uploads')
  @UseInterceptors(
    FilesInterceptor('files', 12, {
      storage: diskStorage({
        destination: 'public/uploads/project-requests',
        filename: (_req, file, cb) => {
          const safeExt =
            extname(file.originalname || '').slice(0, 10) || '.bin';
          const name = `r_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB / fichier
    }),
  )
  async uploadProjectRequestFiles(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: any[],
    @Body(new DefaultValuePipe({})) body: UploadKindBodyDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const userId = String(userIdHeader || '').trim();
    if (!userId) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    const kind = body?.kind === 'site_photo' ? 'site_photo' : 'attachment';
    const list = Array.isArray(files) ? files : [];
    if (list.length === 0) {
      throw new BadRequestException(
        'Aucun fichier reçu (champ multipart: files).',
      );
    }

    const base = `${req.protocol}://${req.get('host')}`;
    const urls = list
      .map((f) => String(f?.filename || '').trim())
      .filter(Boolean)
      .map(
        (filename) =>
          `${base}/uploads/project-requests/${encodeURIComponent(filename)}`,
      );

    return this.projectService.appendProjectRequestUploads(id, userId, {
      kind,
      urls,
    });
  }

  @Post(':id/expert/feedback')
  setExpertFeedback(
    @Param('id') id: string,
    @Body() body: ExpertFeedbackDto,
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = expertIdHeader?.trim();
    if (!expertId) {
      throw new BadRequestException(
        'En-tête x-user-id requis (identifiant de l’expert connecté).',
      );
    }
    return this.projectService.setExpertProjectFeedback(
      id,
      expertId,
      String(body?.text ?? ''),
    );
  }

  /** Client propriétaire : annule le projet */
  @Post(':id/cancel-by-client')
  cancelByClient(
    @Param('id') id: string,
    @Headers('x-user-id') clientIdHeader?: string,
  ) {
    const clientId = String(clientIdHeader || '').trim();
    if (!clientId) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    return this.projectService.cancelByClient(id, clientId);
  }

  /** Expert assigné : avancement manuel (sans photo) + ligne de suivi */
  @Post(':id/expert/manual-progress')
  expertManualProgress(
    @Param('id') id: string,
    @Body() body: ExpertManualProgressDto,
    @Headers('x-user-id') expertIdHeader?: string,
  ) {
    const expertId = String(expertIdHeader || '').trim();
    if (!expertId) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    return this.projectService.recordExpertManualProgress(
      id,
      expertId,
      Number(body?.avancement),
      body?.note,
    );
  }

  @Get('expert/:expertId')
  findByExpert(@Param('expertId') expertId: string) {
    return this.projectService.findByExpertId(expertId);
  }

  @Get('client/:clientId/completed')
  findCompletedByClient(@Param('clientId') clientId: string) {
    return this.projectService.findCompletedByClient(clientId);
  }

  @Get('artisan/:artisanId')
  findAcceptedByArtisan(@Param('artisanId') artisanId: string) {
    return this.projectService.findAcceptedByArtisan(artisanId);
  }

  @Get('artisan/:artisanId/completed')
  findCompletedByArtisan(@Param('artisanId') artisanId: string) {
    return this.projectService.findCompletedByArtisan(artisanId);
  }

  @Get('mine-as-artisan')
  findMineAsArtisan(
    @Query('artisanId') artisanIdFromQuery?: string,
    @Headers('x-user-id') artisanIdFromHeader?: string,
  ) {
    const artisanId = artisanIdFromQuery || artisanIdFromHeader;
    if (!artisanId) return [];
    return this.projectService.findAcceptedByArtisan(artisanId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(
      id,
      updateProjectDto as unknown as Partial<Project>,
    );
  }

  @Post(':id/rate')
  rateProject(@Param('id') id: string, @Body() rating: RateProjectDto) {
    return this.projectService.rateProject(id, rating);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  @Post(':id/apply')
  applyToProject(
    @Param('id') id: string,
    @Body() body: ApplyProjectDto,
    @Query('artisanId') artisanIdFromQuery?: string,
    @Headers('x-user-id') artisanIdFromHeader?: string,
  ) {
    const artisanId =
      body?.artisanId || artisanIdFromQuery || artisanIdFromHeader;

    if (!artisanId) {
      throw new BadRequestException('artisanId est requis pour postuler.');
    }

    return this.projectService.applyToProject(id, artisanId);
  }
}
