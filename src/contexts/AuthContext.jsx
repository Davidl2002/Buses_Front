import { createContext, useContext, useState, useEffect } from 'react';
import { authService, cooperativaService } from '@/services';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cooperativa, setCooperativa] = useState(null);

  useEffect(() => {
    // Cargar usuario del localStorage
    const load = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && storedUser !== 'undefined' && token) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          
          // SUPER_ADMIN: cargar cooperativa seleccionada
          if (parsed.role === 'SUPER_ADMIN') {
            try {
              const activeCoopId = localStorage.getItem('activeCooperativaId');
              if (activeCoopId) {
                const coopRes = await cooperativaService.getById(activeCoopId);
                setCooperativa(coopRes.data.data || null);
              }
            } catch (err) {
              console.error('Error loading cooperativa for SUPER_ADMIN:', err);
              setCooperativa(null);
            }
          }
          // ADMIN: cargar su cooperativa usando getAll (retorna solo su cooperativa)
          else if (parsed.role === 'ADMIN' && parsed.cooperativaId) {
            try {
              const coopRes = await cooperativaService.getAll();
              const cooperativas = coopRes.data.data || [];
              const miCooperativa = cooperativas.find(c => 
                (c.id === parsed.cooperativaId || c._id === parsed.cooperativaId)
              );
              setCooperativa(miCooperativa || null);
            } catch (err) {
              console.error('Error loading cooperativa for ADMIN:', err);
              setCooperativa(null);
            }
          }
          
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  // Aplicar colores de la cooperativa a variables CSS para que Tailwind los use
  useEffect(() => {
    const applyColors = (config) => {
      if (!config) return;
      const hexToHslParts = (hex) => {
        if (!hex) return null;
        // Remove # if present
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;
        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
            case gNorm: h = (bNorm - rNorm) / d + 2; break;
            case bNorm: h = (rNorm - gNorm) / d + 4; break;
          }
          h = h * 60;
        }
        // return string "h s% l%" matching tailwind config usage
        return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      const setVar = (name, value) => {
        try {
          document.documentElement.style.setProperty(name, value);
        } catch (err) {
          // ignore (SSR or non-browser)
        }
      };

      // primary
      if (config.primaryColor) {
        const p = hexToHslParts(config.primaryColor);
        if (p) setVar('--primary', p);
        // set ring as primary too
        if (p) setVar('--ring', p);
        // foreground: pick white/dark based on lightness
        const lightness = parseInt(p.split(' ')[2]);
        const foreground = lightness < 60 ? '0 0% 100%' : '222.2 84% 4.9%';
        setVar('--primary-foreground', foreground);
      }

      // secondary
      if (config.secondaryColor) {
        const s = hexToHslParts(config.secondaryColor);
        if (s) setVar('--secondary', s);
        const lightness = parseInt(s.split(' ')[2]);
        const foreground = lightness < 60 ? '0 0% 100%' : '222.2 84% 4.9%';
        setVar('--secondary-foreground', foreground);
      }
    };

    if (cooperativa?.config) {
      applyColors(cooperativa.config);
      
      // Notificar cambio visual
      toast.success('Tema actualizado', {
        duration: 2000,
        position: 'bottom-right',
      });
    }
  }, [cooperativa]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // SUPER_ADMIN: debe seleccionar cooperativa después
      if (userData.role === 'SUPER_ADMIN') {
        setCooperativa(null);
      }
      // ADMIN: cargar su cooperativa
      else if (userData.role === 'ADMIN' && userData.cooperativaId) {
        try {
          const coopRes = await cooperativaService.getAll();
          const cooperativas = coopRes.data.data || [];
          const miCooperativa = cooperativas.find(c => 
            (c.id === userData.cooperativaId || c._id === userData.cooperativaId)
          );
          setCooperativa(miCooperativa || null);
        } catch (err) {
          console.error('Error loading cooperativa for ADMIN after login:', err);
          setCooperativa(null);
        }
      }
      
      toast.success('¡Bienvenido!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token, user: newUser } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      // SUPER_ADMIN: debe seleccionar cooperativa después
      if (newUser.role === 'SUPER_ADMIN') {
        setCooperativa(null);
      }
      // ADMIN: cargar su cooperativa
      else if (newUser.role === 'ADMIN' && newUser.cooperativaId) {
        try {
          const coopRes = await cooperativaService.getAll();
          const cooperativas = coopRes.data.data || [];
          const miCooperativa = cooperativas.find(c => 
            (c.id === newUser.cooperativaId || c._id === newUser.cooperativaId)
          );
          setCooperativa(miCooperativa || null);
        } catch (err) {
          console.error('Error loading cooperativa for ADMIN after register:', err);
          setCooperativa(null);
        }
      }
      
      toast.success('¡Cuenta creada exitosamente!');
      return newUser;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrarse');
      throw error;
    }
  };

  // Permite al SUPER_ADMIN seleccionar la cooperativa con la que "trabaja" actualmente
  const selectCooperativa = async (coopOrId) => {
    try {
      let coopObj = coopOrId;
      if (typeof coopOrId === 'string') {
        const res = await cooperativaService.getById(coopOrId);
        coopObj = res.data.data || null;
      }
      setCooperativa(coopObj);
      try { localStorage.setItem('activeCooperativaId', coopObj?.id || coopObj?._id || ''); } catch (e) {}
      return coopObj;
    } catch (err) {
      console.error('Error selecting cooperativa:', err);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCooperativa(null);
    toast.success('Sesión cerrada');
  };

  const refreshCooperativa = async () => {
    try {
      // SUPER_ADMIN: refrescar la cooperativa activa seleccionada
      if (user?.role === 'SUPER_ADMIN') {
        const activeCoopId = localStorage.getItem('activeCooperativaId');
        if (!activeCoopId) return null;
        
        const res = await cooperativaService.getById(activeCoopId);
        const freshCoop = res.data.data || null;
        setCooperativa(freshCoop);
        return freshCoop;
      }
      
      // ADMIN: refrescar su cooperativa usando getAll
      if (user?.role === 'ADMIN' && user?.cooperativaId) {
        const coopRes = await cooperativaService.getAll();
        const cooperativas = coopRes.data.data || [];
        const miCooperativa = cooperativas.find(c => 
          (c.id === user.cooperativaId || c._id === user.cooperativaId)
        );
        setCooperativa(miCooperativa || null);
        return miCooperativa || null;
      }
      
      return null;
    } catch (err) {
      console.error('Error refreshing cooperativa:', err);
      return null;
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    loading,
    cooperativa,
    selectCooperativa,
    login,
    register,
    logout,
    hasRole,
    isAuthenticated: !!user,
    refreshCooperativa
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
