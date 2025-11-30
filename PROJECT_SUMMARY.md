# 📋 Documentación Completa - MoviPass Frontend

## 🎯 Resumen del Proyecto

**MoviPass** es un sistema moderno de venta de tickets para buses interprovinciales desarrollado con React, Vite, Tailwind CSS y shadcn/ui. El frontend está completamente integrado con la API del backend y ofrece una experiencia de usuario fluida y responsive.

---

## ✅ Estado del Proyecto

### ✔️ Completado

#### 🔧 Configuración Base
- [x] Vite + React configurado
- [x] Tailwind CSS integrado
- [x] shadcn/ui components instalados
- [x] ESLint configurado
- [x] Path aliases (@/) configurados
- [x] PostCSS y Autoprefixer

#### 🎨 Componentes UI Implementados
- [x] Button (con variantes)
- [x] Input (formularios)
- [x] Card (tarjetas de contenido)
- [x] Label (etiquetas)
- [x] Dialog (modales)
- [x] Select (dropdowns)
- [x] Table (tablas de datos)

#### 🔐 Autenticación y Seguridad
- [x] AuthContext implementado
- [x] Login page
- [x] Register page
- [x] Protected Routes por roles
- [x] Interceptores Axios (token JWT)
- [x] Manejo de sesiones con localStorage

#### 🌐 Módulos Públicos (Sin Login)
- [x] **TripSearch**: Búsqueda de viajes con filtros
  - Origen y destino
  - Fecha
  - Filtros adicionales (AC, WiFi)
- [x] **SeatMap**: Mapa interactivo de asientos
  - Vista de bus con pasillo
  - Asientos disponibles/ocupados/VIP
  - Selección de asiento
- [x] **Home Page**: Página principal con hero section

#### 👤 Módulo Cliente
- [x] **MyTickets**: Gestión de tickets
  - Lista de tickets comprados
  - Estados (Reservado, Confirmado, Usado, Cancelado)
  - Códigos QR
  - Cancelación de tickets
- [x] **Checkout**: Flujo de compra (básico)

#### 🔧 Módulo Admin/Oficinista
- [x] **Dashboard**: Panel con estadísticas
  - Contador de cooperativas
  - Contador de buses
  - Contador de rutas
  - Viajes del día
  - Acciones rápidas

#### 🚗 Módulo Chofer
- [x] **Manifest**: Manifiesto de pasajeros
  - Lista completa de pasajeros
  - Estado de abordaje
  - Información del viaje
  - Estadísticas (total, abordados, pendientes)

#### 🎨 Layout y Navegación
- [x] **Header**: Navegación principal responsive
  - Logo
  - Links por rol
  - Perfil de usuario
  - Logout
  - Menú móvil hamburguesa
- [x] **Footer**: Pie de página
- [x] **Router**: React Router con protección

#### 📡 Servicios API
- [x] Auth Service (login, register, profile)
- [x] Trip Service (search, getAll, assignPersonnel)
- [x] Ticket Service (getSeatMap, reserve, create, myTickets, cancel, PayPal)
- [x] Cooperativa Service (CRUD)
- [x] Bus Service (CRUD, groups)
- [x] Route Service (CRUD)
- [x] Frequency Service (CRUD, generateTrips)
- [x] Operation Service (QR, manifest, expenses, reports)

---

## 📁 Estructura de Archivos Creados

```
MovPass_Front/
├── public/
│   └── bus-icon.svg                    # ✅ Icono SVG del bus
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.jsx             # ✅ Componente Button
│   │   │   ├── input.jsx              # ✅ Componente Input
│   │   │   ├── card.jsx               # ✅ Componente Card
│   │   │   ├── label.jsx              # ✅ Componente Label
│   │   │   ├── dialog.jsx             # ✅ Componente Dialog
│   │   │   ├── select.jsx             # ✅ Componente Select
│   │   │   └── table.jsx              # ✅ Componente Table
│   │   ├── layout/
│   │   │   ├── Header.jsx             # ✅ Header responsive
│   │   │   └── Footer.jsx             # ✅ Footer
│   │   ├── public/
│   │   │   ├── TripSearch.jsx         # ✅ Búsqueda de viajes
│   │   │   └── SeatMap.jsx            # ✅ Mapa de asientos
│   │   └── ProtectedRoute.jsx         # ✅ HOC para protección
│   ├── contexts/
│   │   └── AuthContext.jsx            # ✅ Context de autenticación
│   ├── pages/
│   │   ├── admin/
│   │   │   └── Dashboard.jsx          # ✅ Dashboard admin
│   │   ├── driver/
│   │   │   └── Manifest.jsx           # ✅ Manifiesto chofer
│   │   ├── Home.jsx                   # ✅ Página principal
│   │   ├── Login.jsx                  # ✅ Login
│   │   ├── Register.jsx               # ✅ Registro
│   │   └── MyTickets.jsx              # ✅ Mis tickets
│   ├── services/
│   │   ├── api.js                     # ✅ Configuración Axios
│   │   └── index.js                   # ✅ Todos los servicios
│   ├── lib/
│   │   ├── utils.js                   # ✅ Utilidades (cn)
│   │   └── constants.js               # ✅ Constantes
│   ├── App.jsx                        # ✅ App principal
│   ├── main.jsx                       # ✅ Entry point
│   └── index.css                      # ✅ Estilos globales
├── .editorconfig                      # ✅ Config del editor
├── .eslintrc.cjs                      # ✅ Config ESLint
├── .gitignore                         # ✅ Git ignore
├── components.json                    # ✅ Config shadcn
├── index.html                         # ✅ HTML base
├── jsconfig.json                      # ✅ Path aliases
├── package.json                       # ✅ Dependencies
├── postcss.config.js                  # ✅ PostCSS
├── tailwind.config.js                 # ✅ Tailwind config
├── vite.config.js                     # ✅ Vite config
├── start.ps1                          # ✅ Script de inicio
├── README.md                          # ✅ Documentación
├── QUICKSTART.md                      # ✅ Guía rápida
└── PROJECT_SUMMARY.md                 # ✅ Este archivo
```

---

## 🚀 Comandos Disponibles

```powershell
# Instalar dependencias
npm install

# Iniciar desarrollo (método 1)
npm run dev

# Iniciar desarrollo (método 2 - con script)
.\start.ps1

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## 🎨 Paleta de Colores

```css
Primary: #3B82F6 (Azul)
Secondary: #F1F5F9 (Gris claro)
Success: #10B981 (Verde)
Warning: #F59E0B (Naranja)
Error: #EF4444 (Rojo)
```

---

## 📱 Breakpoints Responsive

```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

---

## 🔐 Roles del Sistema

### ADMIN / OFICINISTA
- Dashboard con estadísticas
- Gestión completa de cooperativas
- Gestión de buses y grupos
- Gestión de rutas
- Gestión de frecuencias
- Generación de viajes
- Reportes de ganancias
- Validación de QR

### CHOFER
- Ver manifiesto de pasajeros
- Validar tickets QR
- Registrar gastos del viaje

### CLIENTE
- Buscar viajes
- Ver asientos disponibles
- Reservar/Comprar tickets
- Ver mis tickets
- Descargar QR
- Cancelar reservas
- Pagar con PayPal

### PÚBLICO (sin login)
- Buscar viajes
- Ver asientos disponibles
- Registro de cuenta

---

## 🌐 Endpoints Utilizados

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/profile`
- `POST /api/auth/staff`

### Trips
- `GET /api/trips/search`
- `GET /api/trips`
- `GET /api/trips/:id`
- `PATCH /api/trips/:id/personnel`

### Tickets
- `GET /api/tickets/seat-map/:tripId`
- `POST /api/tickets/reserve-seat`
- `POST /api/tickets`
- `GET /api/tickets/my-tickets`
- `PATCH /api/tickets/:id/cancel`
- `POST /api/tickets/payment/paypal/initiate`

### Cooperativas
- `GET /api/cooperativas`
- `POST /api/cooperativas`
- `PUT /api/cooperativas/:id`
- `DELETE /api/cooperativas/:id`

### Buses
- `GET /api/buses`
- `POST /api/buses`
- `GET /api/buses/groups`
- `POST /api/buses/groups`

### Routes
- `GET /api/routes`
- `POST /api/routes`

### Frequencies
- `GET /api/frequencies`
- `POST /api/frequencies`
- `POST /api/frequencies/generate-trips`

### Operations
- `POST /api/operations/validate-qr`
- `GET /api/operations/manifest/:tripId`
- `POST /api/operations/expenses`
- `GET /api/operations/reports/trip/:tripId`
- `GET /api/operations/reports/cooperativa`

---

## 📦 Dependencias Principales

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "axios": "^1.6.2",
  "tailwindcss": "^3.3.6",
  "lucide-react": "^0.294.0",
  "date-fns": "^3.0.0",
  "qrcode.react": "^3.1.0",
  "react-hot-toast": "^2.4.1",
  "@radix-ui/*": "Varios componentes"
}
```

---

## ⚙️ Configuraciones Importantes

### Proxy (Desarrollo)
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

### Base URL (API)
```javascript
// src/services/api.js
baseURL: 'http://localhost:3000/api'
```

---

## 🎯 Flujos de Usuario Implementados

### 1. Búsqueda y Reserva (Público → Cliente)
```
Home → Buscar viaje → Ver asientos → Login/Register → Reservar → Pago → Ticket
```

### 2. Gestión de Tickets (Cliente)
```
Login → Mis Tickets → Ver QR / Cancelar
```

### 3. Administración (Admin)
```
Login → Dashboard → Gestionar entidades → Generar viajes → Reportes
```

### 4. Operación de Viaje (Chofer)
```
Login → Mis Viajes → Manifiesto → Validar QR → Registrar gastos
```

---

## 🔄 Estado del Desarrollo

### ✅ Funcional
- Sistema de autenticación completo
- Búsqueda de viajes
- Selección de asientos
- Gestión de tickets
- Dashboard básico
- Manifiesto de pasajeros
- Routing protegido

### 🚧 Por Implementar/Mejorar
- [ ] Integración completa de PayPal
- [ ] Formularios CRUD completos para Admin
- [ ] Validación de QR con scanner
- [ ] Registro de gastos del chofer
- [ ] Reportes detallados con gráficos
- [ ] Sistema de notificaciones
- [ ] Chat de soporte
- [ ] PWA (Progressive Web App)
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)

---

## 🐛 Problemas Conocidos y Soluciones

### 1. Warnings de CSS (@tailwind)
**Problema**: VS Code muestra errores en las directivas `@tailwind`
**Solución**: Son warnings normales de CSS, no afectan la compilación

### 2. Import errors de date-fns/locale
**Problema**: Posible error al importar locales
**Solución**: Verificar que date-fns esté instalado correctamente

### 3. 401 Unauthorized
**Problema**: Errores de autenticación
**Solución**: Verificar que el backend esté corriendo y el token sea válido

---

## 📝 Notas de Desarrollo

### Buenas Prácticas Implementadas
- ✅ Componentes reutilizables
- ✅ Separación de concerns (services, components, pages)
- ✅ Context API para estado global
- ✅ Custom hooks potenciales
- ✅ Path aliases para imports limpios
- ✅ Responsive design mobile-first
- ✅ Accesibilidad (ARIA labels)

### Patrones de Diseño
- **HOC**: ProtectedRoute
- **Context**: AuthContext
- **Service Layer**: Separación de lógica API
- **Compound Components**: Card, Dialog de shadcn

---

## 🎓 Aprendizajes del Proyecto

### Tecnologías Dominadas
- React 18 (Hooks, Context)
- Vite (Build tool moderno)
- Tailwind CSS (Utility-first)
- shadcn/ui (Component library)
- React Router v6
- Axios interceptors
- JWT authentication

### Conceptos Aplicados
- SPA (Single Page Application)
- Responsive Design
- Protected Routes
- State Management
- API Integration
- Form Handling
- Error Handling

---

## 🚀 Próximos Pasos Recomendados

1. **Completar CRUDs de Admin**
   - Formularios para crear/editar cooperativas
   - Formularios para buses
   - Formularios para rutas

2. **Mejorar UX**
   - Loading states más visuales
   - Skeleton loaders
   - Animaciones de transición

3. **Testing**
   - Unit tests con Vitest
   - Integration tests
   - E2E tests con Cypress

4. **Optimización**
   - Code splitting
   - Lazy loading de rutas
   - Optimización de imágenes

5. **Seguridad**
   - Validación de inputs
   - Sanitización de datos
   - Rate limiting

---

## 📞 Soporte

Para cualquier duda o problema:
1. Revisar README.md
2. Revisar QUICKSTART.md
3. Verificar configuración del backend
4. Revisar consola del navegador
5. Revisar consola de VS Code

---

## ✨ Créditos

**Desarrollado con:**
- React + Vite
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Y mucho ☕

---

**Última actualización**: 27 de noviembre de 2025
**Versión**: 1.0.0
**Estado**: ✅ Funcional y listo para desarrollo
