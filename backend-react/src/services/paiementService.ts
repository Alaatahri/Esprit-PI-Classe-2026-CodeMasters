import api from './api';

export interface Paiement {
  _id: string;
  montant: number;
  methode_paiement: string;
  date_paiement: string;
  createdAt: string;
  factureId?: {
    _id: string;
    numero_facture: string;
    temp_client_nom?: string;
    temp_client_email?: string;
  };
  details?: {
    nom?: string;
    prenom?: string;
    email?: string;
    carte?: string;
    reference?: string;
  };
}

export interface PaiementStats {
  volumeTotal: number;
  sommeFactures: number;
  sommePayee: number;
  transactions: number;
  carte: number;
  virement: number;
  especes: number;
}

const paiementService = {
  getAll: () => api.get<Paiement[]>('/factures/paiements/all'),
  getStats: () => api.get<PaiementStats>('/factures/paiements/stats'),
};

export default paiementService;
