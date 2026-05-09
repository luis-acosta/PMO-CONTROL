import axios from 'axios';

// En producción (dominio real) llama directamente al backend público.
// En desarrollo (localhost) usa el proxy de Next.js para evitar problemas de CORS.
const getBaseURL = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pmo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
