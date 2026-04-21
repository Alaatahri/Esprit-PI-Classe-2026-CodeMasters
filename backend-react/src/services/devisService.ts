import api from './api';

export interface Devis {
  _id: string;
  numero_devis: string;
  titre: string;
  description?: string;
  total: number;
  statut: 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'expiré';
  date_creation: string;
  temp_client_nom?: string;
  temp_client_email?: string;
  articles?: any[];
}

const devisService = {
  getAll: () => api.get<Devis[]>('/devis'),
  getOne: (id: string) => api.get<Devis>(`/devis/${id}`),
  remove: (id: string) => api.delete(`/devis/${id}`),
  action: (id: string, endpoint: string) => api.post(`/devis/${id}/${endpoint}`),
};

export default devisService;
