import api from './api';
import { cacheService } from '../utils/cache';
import type { Project } from './projectService';
import type { User } from './userService';

export interface DashboardData {
  projects: Project[];
  users: User[];
}

export const dashboardService = {
  getData: async (): Promise<DashboardData> => {
    const cacheKey = 'dashboard:data';
    const cached = cacheService.get<DashboardData>(cacheKey);
    if (cached) return cached;
    const { data } = await api.get<DashboardData>('/dashboard');
    cacheService.set(cacheKey, data);
    return data;
  },
};
