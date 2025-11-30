import api from './api';

// Auth
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  createStaff: (staffData) => api.post('/auth/staff', staffData),
};

// Trips
export const tripService = {
  search: (params) => api.get('/trips/search', { params }),
  getOriginCities: () => api.get('/trips/cities/origins'),
  getDestinationCities: (origin) => api.get('/trips/cities/destinations', { params: { origin } }),
  getAvailableDates: (origin, destination) => api.get('/trips/dates/available', { params: { origin, destination } }),
  getAll: () => api.get('/trips'),
  getById: (id) => api.get(`/trips/${id}`),
  // Public endpoint to fetch trip details without authentication
  getPublicById: (id) => api.get(`/trips/public/${id}`),
  getSeats: (id) => api.get(`/trips/${id}/seats`),
  getMyTrips: (params) => api.get('/trips', { params }),
  assignPersonnel: (id, data) => api.patch(`/trips/${id}/personnel`, data),
  getRouteSheet: (params) => api.get('/trips/route-sheet', { params })
};

// Tickets
export const ticketService = {
  getSeatMap: (tripId) => api.get(`/tickets/seat-map/${tripId}`),
  reserveSeat: (data) => api.post('/tickets/reserve-seat', data),
  // POST /api/tickets is the canonical create endpoint; /tickets/create is supported by backend as alias
  create: (data) => api.post('/tickets', data),
  getMyTickets: () => api.get('/tickets/my-tickets'),
  cancel: (id) => api.patch(`/tickets/${id}/cancel`),
  initiatePayPal: (data) => api.post('/tickets/payment/paypal/initiate', data),
  capturePayPal: (data) => api.post('/tickets/payment/paypal/capture', data),
};

// Cooperativas
export const cooperativaService = {
  getAll: () => api.get('/cooperativas'),
  getById: (id) => api.get(`/cooperativas/${id}`),
  create: (data) => api.post('/cooperativas', data),
  update: (id, data) => api.put(`/cooperativas/${id}`, data),
  delete: (id) => api.delete(`/cooperativas/${id}`),
};

// Buses
export const busService = {
  // now accepts optional params object: busService.getAll({ cooperativaId, status, ... })
  getAll: (params) => api.get('/buses', { params }),
  getById: (id) => api.get(`/buses/${id}`),
  create: (data) => api.post('/buses', data),
  update: (id, data) => api.put(`/buses/${id}`, data),
  delete: (id) => api.delete(`/buses/${id}`),
  getGroups: () => api.get('/buses/groups'),
  createGroup: (data) => api.post('/buses/groups', data),
};

// Routes
export const routeService = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

// Frequencies
export const frequencyService = {
  getAll: () => api.get('/frequencies'),
  getById: (id) => api.get(`/frequencies/${id}`),
  create: (data) => api.post('/frequencies', data),
  update: (id, data) => api.put(`/frequencies/${id}`, data),
  delete: (id) => api.delete(`/frequencies/${id}`),
  generateTrips: (data) => api.post('/frequencies/generate-trips', data),
};

// Operations
export const operationService = {
  validateQR: (data) => api.post('/operations/validate-qr', data),
  getManifest: (tripId) => api.get(`/operations/manifest/${tripId}`),
  createExpense: (data) => api.post('/operations/expenses', data),
  getExpenses: (tripId) => api.get(`/operations/expenses/${tripId}`),
  getTripReport: (tripId) => api.get(`/operations/reports/trip/${tripId}`),
  getCooperativaReport: (params) => api.get('/operations/reports/cooperativa', { params }),
};

// Staff Management
export const staffService = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (staffData) => api.post('/staff', staffData),
  update: (id, staffData) => api.put(`/staff/${id}`, staffData),
  delete: (id) => api.delete(`/staff/${id}`),
};

// Driver Service (alias for staff with driver role)
export const driverService = {
  getAll: () => api.get('/staff?role=DRIVER'), // Backend convierte DRIVER a CHOFER
  getById: (id) => api.get(`/staff/${id}`),
  create: (driverData) => api.post('/staff', { ...driverData, role: 'CHOFER' }),
  update: (id, driverData) => api.put(`/staff/${id}`, driverData),
  delete: (id) => api.delete(`/staff/${id}`),
};

// Enhanced Ticket Service
export const enhancedTicketService = {
  ...ticketService,
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  validate: (id) => api.patch(`/tickets/${id}/validate`),
  cancel: (id) => api.delete(`/tickets/${id}`),
};

// Trip Management (enhanced)
export const tripManagementService = {
  ...tripService,
  create: (tripData) => api.post('/trips', tripData),
  update: (id, tripData) => api.patch(`/trips/${id}`, tripData),
  delete: (id) => api.delete(`/trips/${id}`),
  updateStatus: (id, status) => api.patch(`/trips/${id}/status`, { status }),
  generateMonthly: (year, month) => api.post('/trips/generate-monthly', { year, month }),
};

// Reports Service
export const reportService = {
  getReport: (filters) => api.get('/reports', { params: filters }),
  getSalesReport: (filters) => api.get('/reports/sales', { params: filters }),
  getRouteReport: (filters) => api.get('/reports/routes', { params: filters }),
  getBusReport: (filters) => api.get('/reports/buses', { params: filters }),
  exportReport: (format, filters) => api.get(`/reports/export/${format}`, { 
    params: filters,
    responseType: 'blob'
  }),
};

// SuperAdmin Service
export const superAdminService = {
  // Gestión de Cooperativas
  getAllCooperativas: () => api.get('/super-admin/cooperativas'),
  createCooperativa: (data) => api.post('/super-admin/cooperativas', data),
  updateCooperativa: (id, data) => api.put(`/super-admin/cooperativas/${id}`, data),
  deleteCooperativa: (id) => api.delete(`/super-admin/cooperativas/${id}`),
  
  // Gestión de Admins de Cooperativas
  createCooperativaAdmin: (cooperativaId, adminData) => api.post(`/super-admin/cooperativas/${cooperativaId}/admin`, adminData),
  
  // Monitoreo Global
  getGlobalMetrics: () => api.get('/super-admin/metrics/global'),
  getActiveCooperativas: () => api.get('/super-admin/metrics/cooperativas-activas'),
  
  // Configuración del Sistema
  getCities: () => api.get('/super-admin/cities'),
  createCity: (data) => api.post('/super-admin/cities', data),
  updateCity: (id, data) => api.put(`/super-admin/cities/${id}`, data),
  deleteCity: (id) => api.delete(`/super-admin/cities/${id}`),
  
  getTerminals: () => api.get('/super-admin/terminals'),
  createTerminal: (data) => api.post('/super-admin/terminals', data),
  updateTerminal: (id, data) => api.put(`/super-admin/terminals/${id}`, data),
  deleteTerminal: (id) => api.delete(`/super-admin/terminals/${id}`),
};

// Admin Dashboard Service
export const adminDashboardService = {
  // Dashboard Principal
  getDashboard: (params) => api.get('/dashboard/cooperativa', { params }),
  
  // Reportes Financieros
  getFinancialReport: (params) => api.get('/dashboard/financial-report', { params }),
  getBalanceByBus: (params) => api.get('/dashboard/balance-by-bus', { params }),
  
  // Auditoría de Pagos
  getPendingPayments: () => api.get('/dashboard/pending-payments'),
  approvePayment: (ticketId) => api.put(`/dashboard/payment/${ticketId}`, { action: 'approve' }),
  rejectPayment: (ticketId, reason) => api.put(`/dashboard/payment/${ticketId}`, { action: 'reject', reason }),
};

// Cooperativa Config Service
export const cooperativaConfigService = {
  getConfig: (cooperativaId) => api.get(`/cooperativas/${cooperativaId}`),
  updateConfig: (cooperativaId, config) => api.put(`/cooperativas/${cooperativaId}`, { config }),
  uploadLogo: (cooperativaId, logoFile) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    return api.post(`/cooperativas/${cooperativaId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Bus Groups Service
export const busGroupService = {
  getAll: async () => {
    try {
      return await api.get('/buses/groups');
    } catch (err) {
      if (err.response?.status === 404) return api.get('/bus-groups');
      throw err;
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/buses/groups/${id}`);
    } catch (err) {
      if (err.response?.status === 404) return api.get(`/bus-groups/${id}`);
      throw err;
    }
  },
  create: async (data) => {
    try {
      return await api.post('/buses/groups', data);
    } catch (err) {
      if (err.response?.status === 404) return api.post('/bus-groups', data);
      throw err;
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/buses/groups/${id}`, data);
    } catch (err) {
      if (err.response?.status === 404) return api.put(`/bus-groups/${id}`, data);
      throw err;
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/buses/groups/${id}`);
    } catch (err) {
      if (err.response?.status === 404) return api.delete(`/bus-groups/${id}`);
      throw err;
    }
  },
  assignBus: async (groupId, busId) => {
    try {
      return await api.post(`/buses/groups/${groupId}/buses`, { busId });
    } catch (err) {
      if (err.response?.status === 404) return api.post(`/bus-groups/${groupId}/buses`, { busId });
      throw err;
    }
  },
  removeBus: async (groupId, busId) => {
    try {
      return await api.delete(`/buses/groups/${groupId}/buses/${busId}`);
    } catch (err) {
      if (err.response?.status === 404) return api.delete(`/bus-groups/${groupId}/buses/${busId}`);
      throw err;
    }
  },
};

// Cities Admin Service
export const cityService = {
  getAll: (params) => api.get('/cities', { params }),
  getById: (id) => api.get(`/cities/${id}`),
  create: (data) => api.post('/cities', data),
  update: (id, data) => api.put(`/cities/${id}`, data),
  delete: (id) => api.delete(`/cities/${id}`),
};

// Trip Generation Service
export const tripGenerationService = {
  generateMonthlyTrips: (year, month) => api.post('/trips/generate-monthly', { year, month }),
  previewTrips: (year, month) => api.get('/trips/preview-monthly', { params: { year, month } }),
  resolveConflicts: (conflictData) => api.post('/trips/resolve-conflicts', conflictData),
};
