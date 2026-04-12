import axios from 'axios';

const api = axios.create({
  baseURL: typeof window !== 'undefined' 
    ? `http://${window.location.hostname}:3001` 
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
});

export default api;
