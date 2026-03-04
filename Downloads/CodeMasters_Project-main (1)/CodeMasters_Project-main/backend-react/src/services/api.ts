import axios from 'axios';

// Utiliser le proxy Vite (/api → backend) = même origine, plus rapide
const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
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
