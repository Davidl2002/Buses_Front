# MoviPass Frontend

Sistema de venta de tickets para buses interprovinciales construido con React + Vite + Tailwind CSS + shadcn/ui.

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de CSS utility-first
- **shadcn/ui** - Componentes UI de alta calidad
- **React Router** - Navegación y rutas
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificaciones
- **date-fns** - Manejo de fechas
- **qrcode.react** - Generación de códigos QR
- **Lucide React** - Iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Instalar plugin de Tailwind para animaciones
npm install -D tailwindcss-animate
```

## 🏃‍♂️ Ejecutar el proyecto

```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

El proyecto estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── layout/          # Header, Footer
│   ├── public/          # TripSearch, SeatMap
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx  # Context de autenticación
├── pages/
│   ├── admin/           # Dashboard admin
│   ├── driver/          # Manifiesto chofer
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── MyTickets.jsx
├── services/
│   ├── api.js           # Configuración Axios
│   └── index.js         # Servicios API
├── lib/
│   └── utils.js         # Utilidades
├── App.jsx
├── main.jsx
└── index.css
```

## 🔐 Roles y Permisos

### Público (sin login)
- ✅ Búsqueda de viajes
- ✅ Ver asientos disponibles
- ✅ Registro de usuarios

### Cliente
- ✅ Login/Logout
- ✅ Reservar asientos
- ✅ Comprar tickets
- ✅ Ver mis tickets
- ✅ Ver código QR
- ✅ Cancelar tickets
- ✅ Pagar con PayPal

### Admin/Oficinista
- ✅ Dashboard con estadísticas
- ✅ Gestionar cooperativas
- ✅ Gestionar buses
- ✅ Gestionar rutas
- ✅ Gestionar frecuencias
- ✅ Generar viajes
- ✅ Ver reportes
- ✅ Validar tickets QR

### Chofer
- ✅ Ver manifiesto de pasajeros
- ✅ Validar tickets QR
- ✅ Registrar gastos del viaje

## 🔌 Conexión con el Backend

El frontend se conecta al backend en `http://localhost:3000/api`. 

Para cambiar la URL del backend, modifica el archivo `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: 'http://tu-backend-url/api',
  // ...
});
```

También está configurado un proxy en `vite.config.js` para desarrollo:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## 📱 Características Responsive

El diseño está optimizado para:
- 📱 Móviles (< 768px)
- 💻 Tablets (768px - 1024px)
- 🖥️ Desktop (> 1024px)

Utiliza las clases de Tailwind CSS para responsive:
- `sm:` - Small (640px)
- `md:` - Medium (768px)
- `lg:` - Large (1024px)
- `xl:` - Extra Large (1280px)

## 🎨 Personalización de Temas

Los colores se configuran en `src/index.css` usando variables CSS:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... más colores */
}
```

## 🔧 Variables de Entorno (Opcional)

Puedes crear un archivo `.env` para configuraciones:

```env
VITE_API_URL=http://localhost:3000/api
VITE_PAYPAL_CLIENT_ID=tu_client_id
```

Y usarlas en el código:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 📝 Notas Importantes

1. **Autenticación**: El token JWT se guarda en `localStorage`
2. **Interceptors**: Los requests incluyen automáticamente el token en el header
3. **Protección de rutas**: Las rutas privadas verifican autenticación y rol
4. **Toasts**: Se usan para mostrar notificaciones al usuario
5. **QR Codes**: Se generan usando la biblioteca qrcode.react

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
npm install
```

### Errores de linting CSS (@tailwind)
Los errores de `@tailwind` en el CSS son normales y se resuelven al compilar.

### Puerto 5173 en uso
```bash
# Cambia el puerto en vite.config.js
server: {
  port: 3001,
}
```

## 🚀 Próximas Mejoras

- [ ] Implementar pago con PayPal completo
- [ ] Agregar más filtros de búsqueda
- [ ] Implementar chat de soporte
- [ ] Agregar sistema de notificaciones
- [ ] Implementar modo oscuro
- [ ] Agregar PWA (Progressive Web App)

## 📄 Licencia

Este proyecto es parte de un sistema académico.

---

Desarrollado con ❤️ usando React + Vite + Tailwind CSS
