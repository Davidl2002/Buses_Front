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
          // Si el usuario tiene cooperativaId, cargar su cooperativa
          try {
            if (parsed.cooperativaId) {
              const coopRes = await cooperativaService.getById(parsed.cooperativaId);
              setCooperativa(coopRes.data.data || null);
            }
          } catch (err) {
            console.error('Error loading cooperativa on init:', err);
            setCooperativa(null);
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

    applyColors(cooperativa?.config || null);
  }, [cooperativa]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      // Cargar cooperativa asociada si existe
      try {
        if (userData.cooperativaId) {
          const coopRes = await cooperativaService.getById(userData.cooperativaId);
          setCooperativa(coopRes.data.data || null);
        } else {
          setCooperativa(null);
        }
      } catch (err) {
        console.error('Error loading cooperativa after login:', err);
        setCooperativa(null);
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
      // cargar cooperativa si aplica
      try {
        if (newUser.cooperativaId) {
          const coopRes = await cooperativaService.getById(newUser.cooperativaId);
          setCooperativa(coopRes.data.data || null);
        } else {
          setCooperativa(null);
        }
      } catch (err) {
        console.error('Error loading cooperativa after register:', err);
        setCooperativa(null);
      }
      
      toast.success('¡Cuenta creada exitosamente!');
      return newUser;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrarse');
      throw error;
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
    if (!user?.cooperativaId) return null;
    try {
      const res = await cooperativaService.getById(user.cooperativaId);
      setCooperativa(res.data.data || null);
      return res.data.data || null;
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
    login,
    register,
    logout,
    hasRole,
    isAuthenticated: !!user,
    refreshCooperativa
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
