import axios from 'axios';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:5050/api';

export interface MatchWorker {
  _id?: string;
  name?: string;
  workerType?: string;
  experienceYears?: number;
  rating?: number;
}

export interface AiMatchRow {
  _id?: string;
  workerId?: string;
  workerType?: string;
  score?: number;
  breakdown?: {
    skills?: number;
    reputation?: number;
    location?: number;
    experience?: number;
    availability?: number;
  };
  explanation?: string;
  status?: string;
  expiresAt?: string;
  notifiedAt?: string;
  worker?: MatchWorker | null;
}

export interface MatchingProject {
  _id: string;
  titre: string;
  title?: string;
  description?: string;
  projectCategory?: string;
  complexity?: string;
  complexityReasoning?: string;
  requiredWorkerTypes?: string[];
  requiredSkills?: string[];
  budget?: number;
  budget_estime?: number;
  surface?: number;
  location?: { city?: string; gouvernorat?: string };
  matchingStatus?: string;
  status?: string;
  statut?: string;
  aiMatches?: AiMatchRow[];
}

export async function fetchMatchingProjects(): Promise<MatchingProject[]> {
  const { data } = await axios.get<MatchingProject[]>(`${API_BASE}/matching/admin/projects`);
  return data;
}

export interface MatchingRunResponse {
  success?: boolean;
  matchingMeta?: {
    ok?: boolean;
    matchCount?: number;
    reason?: string;
    message?: string;
  };
}

export async function runMatching(
  projectId: string,
  topN: number,
  offset: number,
): Promise<MatchingRunResponse> {
  const { data } = await axios.post<MatchingRunResponse>(`${API_BASE}/matching/run`, {
    projectId,
    topN,
    offset,
  });
  return data;
}
