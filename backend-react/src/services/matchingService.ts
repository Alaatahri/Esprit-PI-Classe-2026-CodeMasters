import api from './api';

export type MatchingRequestStatus = 'pending' | 'accepted' | 'refused';

export interface AdminMatchingRequest {
  _id: string;
  status: MatchingRequestStatus;
  matchScore?: number;
  expiresAt?: string;
  sentAt?: string;
  respondedAt?: string;
  expertId?: { _id: string; nom?: string; email?: string; role?: string; telephone?: string } | string;
  projectId?: { _id: string; titre?: string; statut?: string; budget_estime?: number } | string;
  createdAt?: string;
}

export interface AdminProjectMatchingOverview {
  project: any;
  stats: { inviteCount: number; pending: number; refused: number; accepted: number; acceptedBy: string | null };
  requests: AdminMatchingRequest[];
}

export const matchingService = {
  adminListPending: async (projectId?: string) => {
    const params = projectId ? { projectId } : undefined;
    const { data } = await api.get<AdminMatchingRequest[]>('/admin/matching/requests', { params });
    return data;
  },

  adminProjectOverview: async (projectId: string) => {
    const { data } = await api.get<AdminProjectMatchingOverview>(`/admin/matching/projects/${projectId}`);
    return data;
  },

  adminInviteExpert: async (projectId: string, payload: { expertId: string; matchScore?: number; expiresInDays?: number }) => {
    const { data } = await api.post(`/admin/matching/projects/${projectId}/invite`, payload);
    return data as { ok: boolean; requestId: string; alreadyExisted: boolean };
  },

  adminAutoMatch: async (
    projectId: string,
    payload?: {
      limit?: number;
      expiresInDays?: number;
      minScore?: number;
      aiUrl?: string;
      aiKey?: string;
    },
  ) => {
    const { data } = await api.post(`/admin/matching/projects/${projectId}/auto-match`, payload ?? {});
    return data as {
      ok: boolean;
      projectId: string;
      requested: number;
      created: Array<{ expertId: string; requestId: string; alreadyExisted: boolean; score?: number }>;
    };
  },
};

export default matchingService;

