import api from './api';
import { cacheService } from '../utils/cache';

export interface User {
  _id?: string;
  nom: string;
  email: string;
  mot_de_passe?: string;
  role:
    | 'client'
    | 'expert'
    | 'artisan'
    | 'manufacturer'
    | 'admin'
    | 'ouvrier'
    | 'electricien'
    | 'architecte';
  telephone: string;
  createdAt?: string;
}

export const userService = {
  getAll: async () => {
    const cacheKey = 'users:all';
    const cached = cacheService.get<any>(cacheKey);
    if (cached) return { data: cached };
    const response = await api.get<User[]>('/users');
    cacheService.set(cacheKey, response.data);
    return response;
  },
  getById: async (id: string) => {
    const cacheKey = `users:${id}`;
    const cached = cacheService.get<any>(cacheKey);
    if (cached) return { data: cached };
    const response = await api.get<User>(`/users/${id}`);
    cacheService.set(cacheKey, response.data);
    return response;
  },
  create: async (data: Partial<User>) => {
    cacheService.clear('users:all');
    cacheService.clear('dashboard:data');
    return api.post<User>('/users', data);
  },
  update: async (id: string, data: Partial<User>) => {
    cacheService.clear('users:all');
    cacheService.clear(`users:${id}`);
    cacheService.clear('dashboard:data');
    return api.put<User>(`/users/${id}`, data);
  },
  delete: async (id: string) => {
    cacheService.clear('users:all');
    cacheService.clear(`users:${id}`);
    cacheService.clear('dashboard:data');
    return api.delete(`/users/${id}`);
  },
};

export default userService;
