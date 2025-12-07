import axios from 'axios';

export const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor para agregar el token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sólo redirigir automáticamente si la petición incluía token (es una llamada autenticada)
      const hadAuthHeader = !!error.config?.headers?.Authorization;
      if (hadAuthHeader) {
        try { localStorage.removeItem('token'); } catch (e) {}
        try { localStorage.removeItem('user'); } catch (e) {}
        window.location.href = '/login';
      } else {
        // Para llamadas públicas (p.ej. ciudades, fechas) no redirigir automáticamente;
        // dejamos que el componente maneje el error si lo desea.
        console.warn('401 recibido en endpoint público:', error.config?.url);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
