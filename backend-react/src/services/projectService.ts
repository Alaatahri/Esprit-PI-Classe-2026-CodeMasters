import api from './api';
import { cacheService } from '../utils/cache';

export interface Project {
  _id?: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin_prevue: string;
  budget_estime: number;
  statut: 'En attente' | 'En cours' | 'Terminé';
  avancement_global: number;
  clientId: string;
  expertId?: string;
  createdAt?: string;
}

export const projectService = {
  getAll: async () => {
    const cacheKey = 'projects:all';
    const cached = cacheService.get<any>(cacheKey);
    if (cached) return { data: cached };
    const response = await api.get<Project[]>('/projects');
    cacheService.set(cacheKey, response.data);
    return response;
  },
  getById: async (id: string) => {
    const cacheKey = `projects:${id}`;
    const cached = cacheService.get<any>(cacheKey);
    if (cached) return { data: cached };
    const response = await api.get<Project>(`/projects/${id}`);
    cacheService.set(cacheKey, response.data);
    return response;
  },
  create: async (data: Partial<Project>) => {
    cacheService.clear('projects:all');
    cacheService.clear('dashboard:data');
    return api.post<Project>('/projects', data);
  },
  update: async (id: string, data: Partial<Project>) => {
    cacheService.clear('projects:all');
    cacheService.clear(`projects:${id}`);
    cacheService.clear('dashboard:data');
    return api.put<Project>(`/projects/${id}`, data);
  },
  delete: async (id: string) => {
    cacheService.clear('projects:all');
    cacheService.clear(`projects:${id}`);
    cacheService.clear('dashboard:data');
    return api.delete(`/projects/${id}`);
  },
};

export default projectService;
