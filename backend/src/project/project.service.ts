import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(createProjectDto: Partial<Project>): Promise<Project> {
    const createdProject = new this.projectModel(createProjectDto);
    return createdProject.save();
  }

  async findAll(limit = 100): Promise<Project[]> {
    return this.projectModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async findOne(id: string): Promise<Project> {
    return this.projectModel.findById(id).lean().exec();
  }

  async update(id: string, updateProjectDto: Partial<Project>): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Project> {
    return this.projectModel.findByIdAndDelete(id).exec();
  }

  async updateStatusAndProgress(id: string, avancement: number): Promise<Project> {
    let statut: string;
    if (avancement === 0) {
      statut = 'En attente';
    } else if (avancement === 100) {
      statut = 'Terminé';
    } else {
      statut = 'En cours';
    }

    return this.projectModel.findByIdAndUpdate(
      id,
      { avancement_global: avancement, statut },
      { new: true }
    ).exec();
  }
}
