import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(formData);
      // Si hay pendingPurchase, llevar al home para reanudar flujo de compra
      const pending = sessionStorage.getItem('pendingPurchase');
      if (pending) {
        navigate('/');
        return;
      }

      // Redirigir según el rol
      const redirect = new URLSearchParams(location.search).get('redirect');
      if (redirect) {
        navigate(`/${redirect}`);
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'OFICINISTA') {
        // Todos los roles administrativos van al dashboard general
        navigate('/admin/dashboard');
      } else if (user.role === 'CHOFER') {
        navigate('/driver');
      } else {
        navigate('/my-tickets');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <LogIn className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
          <CardDescription className="text-center">
            Ingresa tu email y contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">¿No tienes cuenta? </span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-primary hover:underline"
              >
                Regístrate
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
