import api from './api';

export type Devis = {
  _id: string;
  projectId: any;
  items: any[];
  totalTTC: number;
  statut: string;
  createdAt: string;
};

export type Contract = {
  _id: string;
  projectId: any;
  totalAmount: number;
  clientSignedAt?: string;
  expertSignedAt?: string;
  status: string;
};

export const billingService = {
  getDevis: () => api.get<Devis[]>('/devis'),
  getContracts: () => api.get<Contract[]>('/contracts'),
};
