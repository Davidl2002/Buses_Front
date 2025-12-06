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
  // GET /api/tickets - con parámetros opcionales para filtrado
  getAll: (params) => api.get('/tickets', { params }),
  // PATCH /api/tickets/:id/cancel - Cancelar ticket (puede incluir reason en body)
  cancel: (id, data) => api.patch(`/tickets/${id}/cancel`, data),
  initiatePayPal: (data) => api.post('/tickets/payment/paypal/initiate', data),
  capturePayPal: (data) => api.post('/tickets/payment/paypal/capture', data),
  // Execute PayPal payment after user approves on PayPal side
  executePayPal: (data) => api.post('/tickets/payment/paypal/execute', data),
  // Descargar PDF del ticket (blob). Backend may expose /tickets/:id/pdf or /tickets/:id/download
  downloadPdf: (id) => api.get(`/tickets/${id}/pdf`, { responseType: 'blob' }),
  getById: (id) => api.get(`/tickets/${id}`),
};

// Cooperativas - API exacta según backend
export const cooperativaService = {
  // GET /api/cooperativas - SUPER_ADMIN lista todas; otros roles solo su cooperativa
  getAll: (params) => api.get('/cooperativas', { params }),
  // GET /api/cooperativas/:id - Requiere autenticación
  getById: (id) => api.get(`/cooperativas/${id}`),
  // POST /api/cooperativas - Requiere rol SUPER_ADMIN
  create: (data) => api.post('/cooperativas', data),
  // PUT /api/cooperativas/:id - Requiere ADMIN o SUPER_ADMIN
  update: (id, data) => api.put(`/cooperativas/${id}`, data),
  // DELETE /api/cooperativas/:id - Requiere SUPER_ADMIN
  delete: (id) => api.delete(`/cooperativas/${id}`),
  // PATCH /api/cooperativas/:id/activate - Requiere SUPER_ADMIN
  activate: (id) => api.patch(`/cooperativas/${id}/activate`),
  // Validaciones locales antes de enviar
  validatePayload: (data) => {
    const errors = [];
    if (!data.nombre || data.nombre.trim().length < 3) {
      errors.push('Nombre debe tener al menos 3 caracteres');
    }
    if (!data.ruc || data.ruc.length !== 13) {
      errors.push('RUC debe tener exactamente 13 caracteres');
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email inválido');
    }
    return errors;
  }
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
  // GET /api/tickets - Listar todos los tickets con filtros opcionales
  // Params: status, tripId, cooperativaId (solo SUPER_ADMIN)
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  validate: (id) => api.patch(`/tickets/${id}/validate`),
  // PATCH /api/tickets/:id/cancel - Cancelar ticket y liberar asiento
  cancel: (id) => api.patch(`/tickets/${id}/cancel`),
  // Descargar PDF del ticket (blob)
  downloadPdf: (id) => api.get(`/tickets/${id}/pdf`, { responseType: 'blob' }),
  // POST /api/tickets/payment/upload-proof - Subir comprobante bancario
  uploadPaymentProof: (ticketId, file) => {
    const formData = new FormData();
    formData.append('ticketId', ticketId);
    formData.append('paymentProof', file);
    return api.post('/tickets/payment/upload-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
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
  getPendingPayments: (params) => api.get('/dashboard/pending-payments', { params }),
  approvePayment: (ticketId, params) => api.put(`/dashboard/payment/${ticketId}${params ? '?' + new URLSearchParams(params).toString() : ''}`, { action: 'approve' }),
  rejectPayment: (ticketId, reason, params) => api.put(`/dashboard/payment/${ticketId}${params ? '?' + new URLSearchParams(params).toString() : ''}`, { action: 'reject', reason }),
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
  getAll: async (params) => {
    try {
      // Usar /buses/allGroups que filtra automáticamente según el rol y cooperativa
      return await api.get('/buses/allGroups', { params });
    } catch (err) {
      // Fallback a endpoints antiguos
      if (err.response?.status === 404) {
        try {
          return await api.get('/buses/groups', { params });
        } catch (err2) {
          return api.get('/bus-groups', { params });
        }
      }
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
