import { useAuth } from '@/contexts/AuthContext';

// Definición de permisos por rol según el backend
const PERMISSIONS = {
  SUPER_ADMIN: ['*'], // Todos los permisos
  ADMIN: [
    'manage_buses',
    'manage_routes',
    'manage_frequencies',
    'generate_trips',
    'manage_staff',
    'view_reports',
    'sell_tickets',
    'validate_qr',
    'view_manifest',
    'manage_cooperativa'
  ],
  OFICINISTA: [
    'sell_tickets',
    'validate_qr',
    'view_manifest',
    'search_trips',
    'cancel_tickets',
    'print_tickets'
  ],
  CHOFER: [
    'view_my_trips',
    'view_manifest',
    'validate_qr',
    'register_expenses',
    'mark_trip_completed',
    'search_trips'
  ],
  CLIENTE: [
    'search_trips',
    'buy_tickets',
    'view_my_tickets',
    'download_qr',
    'cancel_my_tickets'
  ]
};

/**
 * Hook personalizado para verificar permisos según el rol del usuario
 * 
 * @example
 * const { can, isRole } = usePermissions();
 * 
 * if (can('manage_buses')) {
 *   // Mostrar botón de crear bus
 * }
 * 
 * if (isRole('SUPER_ADMIN')) {
 *   // Mostrar panel de cooperativas
 * }
 */
export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permission - El permiso a verificar
   * @returns {boolean}
   */
  const can = (permission) => {
    if (!user) return false;

    const userPermissions = PERMISSIONS[user.role] || [];
    
    // SUPER_ADMIN tiene todos los permisos
    if (userPermissions.includes('*')) return true;
    
    return userPermissions.includes(permission);
  };

  /**
   * Verifica si el usuario tiene uno de varios permisos
   * @param {string[]} permissions - Array de permisos
   * @returns {boolean}
   */
  const canAny = (permissions) => {
    return permissions.some(permission => can(permission));
  };

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param {string[]} permissions - Array de permisos
   * @returns {boolean}
   */
  const canAll = (permissions) => {
    return permissions.every(permission => can(permission));
  };

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string|string[]} roles - Rol o array de roles
   * @returns {boolean}
   */
  const isRole = (roles) => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };

  /**
   * Verifica si es personal administrativo
   * @returns {boolean}
   */
  const isAdmin = () => {
    return isRole(['SUPER_ADMIN', 'ADMIN']);
  };

  /**
   * Verifica si es personal operativo
   * @returns {boolean}
   */
  const isStaff = () => {
    return isRole(['SUPER_ADMIN', 'ADMIN', 'OFICINISTA', 'CHOFER']);
  };

  /**
   * Obtiene la etiqueta legible del rol
   * @returns {string}
   */
  const getRoleLabel = () => {
    const labels = {
      SUPER_ADMIN: 'Superadministrador',
      ADMIN: 'Administrador',
      OFICINISTA: 'Oficinista',
      CHOFER: 'Chofer',
      CLIENTE: 'Cliente'
    };
    
    return user ? labels[user.role] || user.role : '';
  };

  return {
    can,
    canAny,
    canAll,
    isRole,
    isAdmin,
    isStaff,
    getRoleLabel,
    permissions: user ? PERMISSIONS[user.role] || [] : [],
    role: user?.role
  };
};

export default usePermissions;
