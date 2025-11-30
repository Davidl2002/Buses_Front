import toast from 'react-hot-toast';

/**
 * Maneja errores de API de manera consistente
 * @param {Error} error - El error capturado
 * @param {string} context - Contexto de la operación (ej: 'cargar buses')
 * @param {Function} fallbackCallback - Función para ejecutar datos de demostración
 */
export const handleApiError = (error, context = 'operación', fallbackCallback = null) => {
  console.error(`Error en ${context}:`, error);
  
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    console.log(`Backend no disponible para ${context}, usando datos de demostración`);
    toast.error(`Backend no disponible - Mostrando datos de demostración`);
    
    if (fallbackCallback && typeof fallbackCallback === 'function') {
      fallbackCallback();
    }
  } else if (error.response?.status === 404) {
    toast.error(`Recurso no encontrado`);
  } else if (error.response?.status === 401) {
    toast.error(`No autorizado - Inicia sesión nuevamente`);
  } else if (error.response?.status >= 500) {
    toast.error(`Error del servidor - Intenta nuevamente`);
  } else {
    toast.error(`Error al ${context}`);
  }
};

/**
 * Procesa respuesta de API de manera consistente
 * @param {Object} response - Respuesta de la API
 * @param {string} dataKey - Clave donde están los datos (default: 'data')
 */
export const processApiResponse = (response, dataKey = 'data') => {
  console.log('API response:', response.data);
  
  if (response.data.success && response.data[dataKey]) {
    return response.data[dataKey];
  } else {
    return response.data[dataKey] || response.data || [];
  }
};

export default {
  handleApiError,
  processApiResponse
};