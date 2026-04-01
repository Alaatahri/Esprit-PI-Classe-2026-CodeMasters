import api from './api';

export type SuiviPhotoResponse = {
  suivi?: Record<string, unknown>;
  ai?: { percent?: number; reason?: string };
  currentMaxBefore?: number;
};

/**
 * Envoie une photo de chantier pour analyse IA (corps JSON : URL + base64).
 * Le backend met à jour `suiviprojects` et `avancement_global`.
 */
export async function uploadSuiviPhoto(payload: {
  projectId: string;
  workerId: string;
  photoUrl: string;
  photoBase64?: string;
}) {
  return api.post<SuiviPhotoResponse>('/suivi/photo', payload, {
    timeout: 120000,
  });
}
