import api from './api';

export type SuiviProjectEntry = {
  _id: string;
  projectId: string;
  date_suivi: string;
  description_progression: string;
  pourcentage_avancement: number;
  cout_actuel?: number;
  photo_url?: string;
  photoUrl?: string;
  uploadedAt?: string;
  progressPercent?: number;
  progressIndex?: number;
  workerId?: string;
  aiAnalysis?: string;
  createdAt?: string;
  updatedAt?: string;
};

const suiviProjectService = {
  /**
   * Liste les entrées de suivi pour un projet (collection `suiviprojects`).
   */
  getByProjectId: async (projectId: string) => {
    return api.get<SuiviProjectEntry[]>(`/suivi-projects`, {
      params: { projectId },
    });
  },
};

export default suiviProjectService;
