import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
