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

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" style={{ color: primaryColor || undefined }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-md overflow-hidden" style={{ width: 40, height: 40, backgroundColor: logoSrc ? 'transparent' : (primaryColor || '#ffffff') }}>
                {logoSrc ? (
                  <img src={logoSrc} alt="logo" className="h-10 w-10 object-contain" />
                ) : (
                  <Bus className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-lg">{coopName || 'MoviPass'}</div>
                <div className="text-xs text-gray-500">Panel Admin</div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {(!user || user.role !== 'ADMIN') && (
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
                
                {(user.role === 'SUPER_ADMIN' || user.role === 'OFICINISTA') && (
                  <Link to="/admin/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                )}
                
                {user.role === 'CHOFER' && (
                  <Link to="/driver" className="hover:text-primary transition-colors">
                    Mis Viajes
                  </Link>
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
            {(!user || user.role !== 'ADMIN') && (
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
                
                {(user.role === 'SUPER_ADMIN' || user.role === 'OFICINISTA') && (
                  <Link
                    to="/admin/dashboard"
                    className="block py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                
                {user.role === 'CHOFER' && (
                  <Link
                    to="/driver"
                    className="block py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mis Viajes
                  </Link>
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
