# 💡 Ejemplos de Uso - MoviPass Frontend

## 🎯 Casos de Uso Prácticos

### 1️⃣ Agregar un Nuevo Componente de Página

Para crear una nueva página (ej: "Historial de Viajes"):

```javascript
// src/pages/TripHistory.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tripService } from '@/services';

export default function TripHistory() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    const response = await tripService.getAll();
    setTrips(response.data.data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Historial de Viajes</h1>
      {/* Tu contenido aquí */}
    </div>
  );
}
```

Luego agregar la ruta en `App.jsx`:

```javascript
import TripHistory from '@/pages/TripHistory';

// Dentro de <Routes>
<Route path="/history" element={<TripHistory />} />
```

---

### 2️⃣ Crear un Nuevo Servicio API

```javascript
// Agregar en src/services/index.js
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
};
```

Usar en un componente:

```javascript
import { notificationService } from '@/services';

const loadNotifications = async () => {
  const response = await notificationService.getAll();
  setNotifications(response.data.data);
};
```

---

### 3️⃣ Proteger una Ruta por Rol

```javascript
// En App.jsx
<Route
  path="/admin/reports"
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'OFICINISTA']}>
      <ReportsPage />
    </ProtectedRoute>
  }
/>
```

Para verificar rol en un componente:

```javascript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { hasRole } = useAuth();

  if (!hasRole(['ADMIN', 'OFICINISTA'])) {
    return <div>No tienes permisos</div>;
  }

  return <div>Contenido admin</div>;
}
```

---

### 4️⃣ Mostrar Notificaciones (Toast)

```javascript
import toast from 'react-hot-toast';

// Success
toast.success('¡Operación exitosa!');

// Error
toast.error('Ocurrió un error');

// Loading
const loadingToast = toast.loading('Cargando...');
// Luego:
toast.dismiss(loadingToast);

// Custom
toast('Mensaje personalizado', {
  icon: '👏',
  duration: 4000,
});
```

---

### 5️⃣ Formatear Fechas

```javascript
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Fecha completa
const formatted = format(new Date(trip.date), 'PPP', { locale: es });
// Resultado: "27 de noviembre de 2025"

// Solo fecha corta
const shortDate = format(new Date(), 'dd/MM/yyyy');
// Resultado: "27/11/2025"

// Con hora
const withTime = format(new Date(), 'dd/MM/yyyy HH:mm');
// Resultado: "27/11/2025 14:30"
```

---

### 6️⃣ Usar el Context de Auth

```javascript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  // Verificar si está autenticado
  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }

  // Mostrar info del usuario
  return (
    <div>
      <p>Bienvenido, {user.firstName}</p>
      <p>Tu rol es: {user.role}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}
```

---

### 7️⃣ Crear un Formulario con Validación

```javascript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

function CreateBusForm() {
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.placa) newErrors.placa = 'La placa es requerida';
    if (!formData.marca) newErrors.marca = 'La marca es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await busService.create(formData);
      toast.success('Bus creado exitosamente');
      // Reset form
      setFormData({ placa: '', marca: '', modelo: '' });
    } catch (error) {
      toast.error('Error al crear el bus');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="placa">Placa</Label>
        <Input
          id="placa"
          value={formData.placa}
          onChange={(e) => setFormData({...formData, placa: e.target.value})}
        />
        {errors.placa && <p className="text-red-500 text-sm">{errors.placa}</p>}
      </div>
      
      <Button type="submit">Crear Bus</Button>
    </form>
  );
}
```

---

### 8️⃣ Crear un Modal/Dialog

```javascript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título del Modal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Contenido del modal aquí</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### 9️⃣ Hacer una Tabla Responsive

```javascript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

function DataTable({ data }) {
  return (
    <Card>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm">Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 🔟 Loading State

```javascript
function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await someService.getData();
      setData(response.data.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <div>{/* Renderizar data */}</div>;
}
```

---

### 1️⃣1️⃣ Select/Dropdown

```javascript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function MyForm() {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <Select value={selectedValue} onValueChange={setSelectedValue}>
      <SelectTrigger>
        <SelectValue placeholder="Selecciona una opción" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Opción 1</SelectItem>
        <SelectItem value="option2">Opción 2</SelectItem>
        <SelectItem value="option3">Opción 3</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

---

### 1️⃣2️⃣ Custom Hook Ejemplo

```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Uso:
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // Hacer búsqueda
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <Input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  );
}
```

---

### 1️⃣3️⃣ Formatear Moneda

```javascript
// src/lib/utils.js
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Uso:
import { formatCurrency } from '@/lib/utils';

function PriceDisplay({ price }) {
  return <span>{formatCurrency(price)}</span>;
  // Resultado: $12.50
}
```

---

### 1️⃣4️⃣ Navegación Programática

```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navegar a otra página
    navigate('/dashboard');
    
    // Con state
    navigate('/trip-details', { state: { tripId: 123 } });
    
    // Ir atrás
    navigate(-1);
    
    // Reemplazar (no agrega al historial)
    navigate('/login', { replace: true });
  };

  return <Button onClick={handleClick}>Ir al Dashboard</Button>;
}
```

---

### 1️⃣5️⃣ Manejo de Errores Global

```javascript
// src/services/api.js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para esta acción');
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor. Intenta más tarde');
    }
    return Promise.reject(error);
  }
);
```

---

## 🎨 Clases de Tailwind Útiles

```css
/* Espaciado */
p-4, py-8, px-6, m-4, mt-6, mb-4

/* Flexbox */
flex, flex-col, flex-row, items-center, justify-between, gap-4

/* Grid */
grid, grid-cols-2, grid-cols-1 md:grid-cols-3, gap-6

/* Colores */
bg-blue-500, text-white, border-gray-200

/* Tamaños */
w-full, h-screen, max-w-md, min-h-screen

/* Responsive */
hidden md:flex, text-sm md:text-base

/* Hover */
hover:bg-blue-600, hover:shadow-lg, transition-all

/* Rounded */
rounded, rounded-lg, rounded-full

/* Shadow */
shadow, shadow-lg, shadow-xl
```

---

## 🚀 Tips de Performance

```javascript
// 1. Lazy loading de rutas
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));

// 2. Memo para evitar re-renders
const MemoizedComponent = memo(MyComponent);

// 3. useCallback para funciones
const handleClick = useCallback(() => {
  // código
}, [dependencies]);

// 4. useMemo para cálculos costosos
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

¡Usa estos ejemplos como referencia para extender tu aplicación! 🎉
