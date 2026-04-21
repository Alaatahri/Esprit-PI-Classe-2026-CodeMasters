import axios from 'axios';

// Utiliser le proxy Vite (/api → backend) = même origine, plus rapide
const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Ajouter automatiquement x-user-id si un user est en session
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('bmp_user');
    if (raw) {
      const user = JSON.parse(raw);
      const userId = user?._id;
      if (userId) {
        config.headers = config.headers || {};
        (config.headers as any)['x-user-id'] = userId;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

// Intercepteur pour les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('API Error: Timeout - Le serveur met trop de temps à répondre');
    } else {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
