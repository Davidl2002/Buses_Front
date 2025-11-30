# 🎯 Guía de Inicio Rápido - MoviPass Frontend

## ✅ Pasos para ejecutar el proyecto

### 1. Instalar dependencias
```powershell
npm install
npm install -D tailwindcss-animate
```

### 2. Verificar que el backend esté corriendo
El backend debe estar ejecutándose en `http://localhost:3000`

### 3. Iniciar el servidor de desarrollo
```powershell
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

## 🧪 Datos de Prueba

### Usuarios de prueba (del backend):

**Admin:**
- Email: `admin@transchimborazo.com`
- Password: `Admin123!`

**Cliente de prueba:**
- Regístrate desde el formulario de registro

## 📱 Flujo de Uso

### Como Usuario Público:
1. Ir a la página principal
2. Buscar viajes (origen, destino, fecha)
3. Ver resultados y seleccionar un viaje
4. Ver mapa de asientos disponibles
5. Seleccionar asiento
6. Login/Registro para continuar

### Como Cliente:
1. Iniciar sesión
2. Buscar y seleccionar viaje
3. Reservar/Comprar ticket
4. Ver "Mis Tickets"
5. Descargar código QR

### Como Admin:
1. Iniciar sesión con credenciales admin
2. Ver dashboard con estadísticas
3. Gestionar cooperativas, buses, rutas
4. Generar viajes automáticamente
5. Ver reportes

### Como Chofer:
1. Iniciar sesión
2. Ver manifiesto de pasajeros
3. Validar tickets con QR
4. Registrar gastos del viaje

## 🔧 Configuración Adicional

### Cambiar URL del Backend
Edita `src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: 'http://tu-nueva-url/api',
});
```

### Configurar PayPal (Opcional)
Agrega tu Client ID en el componente de pago.

## 🎨 Características del Diseño

- ✅ **Responsive**: Funciona en móviles, tablets y desktop
- ✅ **Dark Mode Ready**: Preparado para modo oscuro
- ✅ **Componentes Reutilizables**: shadcn/ui
- ✅ **Animaciones Suaves**: Transiciones con Tailwind
- ✅ **Accesible**: Componentes con ARIA labels

## 🚀 Componentes Principales

### Públicos:
- `TripSearch` - Búsqueda de viajes con filtros
- `SeatMap` - Mapa interactivo de asientos

### Cliente:
- `MyTickets` - Lista de tickets con QR codes

### Admin:
- `Dashboard` - Estadísticas y acciones rápidas

### Chofer:
- `Manifest` - Manifiesto de pasajeros

## 📦 Estructura de Carpetas

```
src/
├── components/
│   ├── ui/              # Componentes base (Button, Input, Card, etc.)
│   ├── layout/          # Header, Footer
│   ├── public/          # Componentes públicos
│   └── ProtectedRoute.jsx
├── contexts/            # React Contexts
├── pages/               # Páginas principales
├── services/            # Servicios API
└── lib/                 # Utilidades y constantes
```

## 🐛 Solución de Problemas

### Error: "Cannot resolve @/..."
```powershell
# Verifica jsconfig.json
```

### Puerto ocupado
Cambia el puerto en `vite.config.js`

### Errores de CSS
Los warnings de `@tailwind` son normales, ignóralos.

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias
2. ✅ Correr el proyecto
3. ✅ Probar login/registro
4. ✅ Buscar viajes
5. ✅ Reservar un asiento
6. 🔄 Integrar con el backend real
7. 🔄 Agregar más funcionalidades admin

---

**¿Problemas?** Revisa el README.md principal para más detalles.
