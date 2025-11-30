import api from './api';

const base = '/routes';

export const routesService = {
  create: (payload) => api.post(`${base}`, payload),
  getAll: (params) => api.get(`${base}`, { params }),
  getById: (id) => api.get(`${base}/${id}`),
  update: (id, payload) => api.put(`${base}/${id}`, payload),
  deactivate: (id) => api.delete(`${base}/${id}`),
};

export default routesService;
