import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SuiviProject, SuiviProjectDocument } from './schemas/suivi-project.schema';
import { ProjectService } from '../project/project.service';

@Injectable()
export class SuiviProjectService {
  constructor(
    @InjectModel(SuiviProject.name)
    private suiviProjectModel: Model<SuiviProjectDocument>,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
  ) {}

  async create(createSuiviDto: Partial<SuiviProject>): Promise<SuiviProject> {
    const createdSuivi = new this.suiviProjectModel(createSuiviDto);
    const savedSuivi = await createdSuivi.save();

    // Automatically update Project status and progress
    const projectId = createSuiviDto.projectId.toString();
    await this.projectService.updateStatusAndProgress(
      projectId,
      createSuiviDto.pourcentage_avancement
    );

    return savedSuivi;
  }

  async findAll(): Promise<SuiviProject[]> {
    return this.suiviProjectModel.find().exec();
  }

  async findByProject(projectId: string): Promise<SuiviProject[]> {
    return this.suiviProjectModel.find({ projectId }).exec();
  }

  /** URLs photos de suivi de chantier (fiche projet publique). */
  async findPublicPhotoUrlsForProject(projectId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(projectId)) return [];
    const rows = await this.suiviProjectModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ date_suivi: 1 })
      .lean()
      .exec();
    return rows
      .map((s: Record<string, unknown>) => {
        const u = s.photoUrl ?? s.photo_url;
        return typeof u === 'string' ? u : '';
      })
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 24);
  }

  async findOne(id: string): Promise<SuiviProject> {
    return this.suiviProjectModel.findById(id).exec();
  }

  async update(id: string, updateSuiviDto: Partial<SuiviProject>): Promise<SuiviProject> {
    const updatedSuivi = await this.suiviProjectModel.findByIdAndUpdate(
      id,
      updateSuiviDto,
      { new: true }
    ).exec();

    // Update project if pourcentage_avancement changed
    if (updateSuiviDto.pourcentage_avancement !== undefined && updatedSuivi) {
      const projectId = updatedSuivi.projectId.toString();
      await this.projectService.updateStatusAndProgress(
        projectId,
        updateSuiviDto.pourcentage_avancement
      );
    }

    return updatedSuivi;
  }

  async remove(id: string): Promise<SuiviProject> {
    return this.suiviProjectModel.findByIdAndDelete(id).exec();
  }
}
