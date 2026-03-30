import api from './api';

export interface WorkerRow {
  _id: string;
  name: string;
  email?: string;
  workerType?: string;
  specialite?: string;
  experienceYears?: number;
  rating?: number;
  isAvailable?: boolean;
  location?: { city?: string; gouvernorat?: string };
}

/** GET /api/workers — via proxy Vite → Nest (port 3001), pas besoin d’Express sur 5050 */
export async function fetchWorkers(): Promise<WorkerRow[]> {
  const { data } = await api.get<WorkerRow[]>('/workers');
  return data;
}
