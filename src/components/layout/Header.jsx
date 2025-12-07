import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bus, Menu, User, LogOut, Ticket } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, logout, cooperativa } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const primaryColor = cooperativa?.config?.primaryColor || null;
  const logoSrc = cooperativa?.config?.logo || null;
  const coopName = cooperativa?.nombre || null;

  // Determinar el nombre del panel según el rol
  const getPanelName = () => {
    if (!user) return 'MoviPass';
    
    switch (user.role) {
      case 'CHOFER':
        return 'Panel Chofer';
      case 'OFICINISTA':
        return 'Panel Oficina';
      case 'ADMIN':
        return 'Panel Admin';
      case 'SUPER_ADMIN':
        return 'Panel Super Admin';
      default:
        return 'MoviPass';
    }
  };

  // Determinar el nombre principal a mostrar
  const getMainName = () => {
    if (!user) return 'MoviPass';
    
    // ADMIN, SUPER_ADMIN, CHOFER y OFICINISTA ven el nombre de la cooperativa
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'CHOFER' || user.role === 'OFICINISTA') {
      return coopName || 'MoviPass';
    }
    
    // Otros roles ven "MoviPass"
    return 'MoviPass';
  };

  // Determinar si el logo debe ser clickeable
  const isLogoClickable = !user || (user.role !== 'ADMIN' && user.role !== 'CHOFER' && user.role !== 'OFICINISTA');

  const LogoContent = () => (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center rounded-md overflow-hidden" style={{ width: 40, height: 40, backgroundColor: logoSrc ? 'transparent' : (primaryColor || '#ffffff') }}>
        {logoSrc ? (
          <img src={logoSrc} alt="logo" className="h-10 w-10 object-contain" />
        ) : (
          <Bus className="h-8 w-8 text-white" />
        )}
      </div>
      <div className="leading-tight">
        <div className="font-bold text-lg">{getMainName()}</div>
        <div className="text-xs text-gray-500">{getPanelName()}</div>
      </div>
    </div>
  );

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {isLogoClickable ? (
            <Link to="/" className="flex items-center gap-3" style={{ color: primaryColor || undefined }}>
              <LogoContent />
            </Link>
          ) : (
            <div className="flex items-center gap-3" style={{ color: primaryColor || undefined }}>
              <LogoContent />
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {(!user || (user.role !== 'ADMIN' && user.role !== 'CHOFER' && user.role !== 'OFICINISTA')) && (
              <Link to="/" className="hover:text-primary transition-colors">
                Inicio
              </Link>
            )}
            
            {user ? (
              // Si el usuario es solo ADMIN mostrar únicamente Dashboard, Perfil y Salir
              user.role === 'ADMIN' ? (
                <>
                  <Link to="/admin/cooperativa-dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => navigate('/profile')}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {user.firstName}
                      </span>
                    </Button>
                    <Button onClick={handleLogout} variant="outline" size="sm">
                      <LogOut className="h-4 w-4 mr-2" />
                      Salir
                    </Button>
                  </div>
                </>
              ) : (
              <>
                {user.role === 'CLIENTE' && (
                  <Link to="/my-tickets" className="hover:text-primary transition-colors">
                    Mis Tickets
                  </Link>
                )}
                
                {user.role === 'SUPER_ADMIN' && (
                  <Link to="/admin/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                )}
                
                {user.role === 'CHOFER' && (
                  <>
                    <Link to="/driver" className="hover:text-primary transition-colors">
                      Mis Viajes
                    </Link>
                    <Link to="/driver/expenses" className="hover:text-primary transition-colors">
                      Mis Gastos
                    </Link>
                  </>
                )}

                {user.role === 'OFICINISTA' && (
                  <>
                    {/* <Link to="/oficinista" className="hover:text-primary transition-colors">
                      Dashboard
                    </Link> */}
                    <Link to="/oficinista/vender-ticket" className="hover:text-primary transition-colors">
                      Vender Ticket
                    </Link>
                    <Link to="/oficinista/mis-ventas" className="hover:text-primary transition-colors">
                      Mis Ventas
                    </Link>
                    <Link to="/oficinista/configuracion" className="hover:text-primary transition-colors">
                      Configuración
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {user.firstName}
                    </span>
                  </Button>
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Salir
                  </Button>
                </div>
              </>
              )
            ) : (
              <div className="flex items-center gap-3">
                <Button onClick={() => navigate('/login')} variant="outline">
                  Iniciar Sesión
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Registrarse
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-3 border-t">
            {(!user || (user.role !== 'ADMIN' && user.role !== 'CHOFER' && user.role !== 'OFICINISTA')) && (
              <Link
                to="/"
                className="block py-2 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
            )}
            
            {user ? (
              user.role === 'ADMIN' ? (
                <>
                  <Link
                    to="/admin/cooperativa-dashboard"
                    className="block py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="pt-3 border-t space-y-2">
                    <Button
                      onClick={() => {
                        navigate('/profile');
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {user.firstName} {user.lastName}
                    </Button>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </>
              ) : (
              <>
                {user.role === 'CLIENTE' && (
                  <Link
                    to="/my-tickets"
                    className="block py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mis Tickets
                  </Link>
                )}
                
                {user.role === 'SUPER_ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className="block py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                
                {user.role === 'CHOFER' && (
                  <>
                    <Link
                      to="/driver"
                      className="block py-2 hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mis Viajes
                    </Link>
                    <Link
                      to="/driver/expenses"
                      className="block py-2 hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mis Gastos
                    </Link>
                  </>
                )}

                {user.role === 'OFICINISTA' && (
                  <>
                    <Link
                      to="/oficinista"
                      className="block py-2 hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/oficinista/vender-ticket"
                      className="block py-2 hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vender Ticket
                    </Link>
                    <Link
                      to="/oficinista/mis-ventas"
                      className="block py-2 hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mis Ventas
                    </Link>
                    <Link
                      to="/oficinista/configuracion"
                      className="block py-2 hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Configuración
                    </Link>
                  </>
                )}

                <div className="pt-3 border-t space-y-2">
                  <Button
                    onClick={() => {
                      navigate('/profile');
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.firstName} {user.lastName}
                  </Button>
                  <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </>
              )
            ) : (
              <div className="space-y-2 pt-3 border-t">
                <Button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Registrarse
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
