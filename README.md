# MoviPass — Frontend

Frontend de MoviPass: aplicación SPA construida con React + Vite para la búsqueda, reserva y venta de tickets de buses interprovinciales.

Este `README` está orientado a desarrolladores: contiene pasos rápidos para levantar el entorno, descripción de la estructura, comandos útiles, y notas de integración con el backend.

## 🚀 Tecnologías principales

- **Framework:** React 18 + Vite
- **Estilos:** Tailwind CSS (+ `tailwindcss-animate` opcional)
- **UI:** shadcn/ui (componentes), Lucide React (iconos)
- **HTTP:** Axios (cliente central en `src/services/api.js`)
- **Fechas:** date-fns
- **Extras:** react-hot-toast, qrcode.react

## Requisitos mínimos

- `Node.js` >= 16 (recomendado 18+)
- `npm` >= 8 (o `yarn` / `pnpm`)
- Backend API accesible (por defecto `http://localhost:3000/api`)

## 📦 Instalación (desarrollo)

1. Clonar el repositorio

```powershell
git clone https://github.com/Davidl2002/Buses_Front.git
cd MovPass_Front
```

2. Instalar dependencias

```powershell
npm install
```

3. Variables de entorno

Crear un archivo `.env` en la raíz (opcional) con la URL del backend y otras claves:

```env
VITE_API_URL=http://localhost:3000/api
VITE_PAYPAL_CLIENT_ID=tu_client_id_paypal
```

4. Levantar en modo desarrollo

```powershell
npm run dev
```

El servidor se sirve por defecto en `http://localhost:5173`.

## 🧭 Comandos útiles

- **Desarrollo:** `npm run dev`
- **Build producción:** `npm run build`
- **Previsualizar build:** `npm run preview`
- **Formateo / Lint (si existe):** `npm run format` / `npm run lint`

## 🔌 Conexión con el backend

- La URL base del API se configura a través de la variable `VITE_API_URL` y en `src/services/api.js`.
- En desarrollo, `vite.config.js` incluye un proxy para redirigir `/api` al backend local.

Si el backend está en otro host/puerto, ajusta `VITE_API_URL` o el proxy de Vite.

## 📁 Estructura principal del proyecto

```text
src/
├─ components/           # Componentes reutilizables y por área
│  ├─ public/            # Buscador público: TripSearch, SeatSelection, SeatMap
│  ├─ admin/             # Componentes administrativos (AdminSeatMap...)
│  └─ ui/                # Wrappers de UI (botones, inputs, dialogs)
├─ contexts/             # AuthContext.jsx
├─ hooks/                # Hooks personalizados (useActiveCooperativaId...)
├─ pages/                # Rutas publicadas (home, login, admin, driver...)
├─ services/             # Cliente Axios (`api.js`) y servicios (`index.js`)
├─ lib/                  # Constantes y utilidades
├─ App.jsx
├─ main.jsx
└─ index.css
```



## ✅ Características principales

- Búsqueda avanzada de viajes (incluye paradas intermedias y filtros)
- Visualización y selección de asientos con motor en tiempo real (Socket.IO en backend)
- Integración de pagos con PayPal (flow de sandbox y ejecución)
- Gestión administrativa: rutas, frecuencias, buses, viajes, reportes
- Crear tickets manuales desde admin/oficinista con validación por viaje/fecha

## 🔐 Roles y permisos (resumen)

- **SUPER_ADMIN:** gestión global de cooperativas
- **ADMIN:** gestión de recursos dentro de su cooperativa
- **OFICINISTA:** ventas y emisión manual de tickets
- **CHOFER:** manifiesto, validación QR, gastos
- **CLIENTE:** compra y historial

## 🛠️ Cómo depurar problemas comunes

- Buscar en consola: `TripSearch.jsx` imprime logs con prefijo `[TripSearch...]` para diagnosticar coincidencias y normalizaciones.
- Network: filtrar por `/api/trips` y `/api/tickets` en la pestaña Network.
- Si el frontend no muestra un viaje esperado, pega el JSON devuelto por `/api/trips/search` o `/api/trips` para que podamos ajustar la normalización o aplicar un fallback cliente.

## Scripts y comandos (PowerShell)

```powershell
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Previsualizar build
npm run preview
```

## Contribuir

1. Crear una rama descriptiva:

```powershell
git checkout -b feat/descripcion-corta
```

2. Hacer cambios, probar localmente y commitear:

```powershell
git add .
git commit -m "feat: descripción breve"
git push origin feat/descripcion-corta
```

3. Abrir Pull Request hacia `main` o `develop` describiendo cambios y pasos para probar.



## Visión completa del proyecto

Esta sección amplía la documentación anterior y cubre en detalle la estructura del frontend, los componentes clave, los flujos de datos con el backend, variables de entorno, despliegue, debugging avanzado y recomendaciones para desarrollo y colaboración.

Si trabajas en este repo: asegúrate de usar la rama `develop` para features en progreso y crear ramas por feature para PRs. Este README asume que el backend (MoviPass_Back) está disponible y documentado por separado.

---

## 1) Resumen del proyecto

MoviPass Frontend es una SPA para búsqueda, reserva y administración de tickets de buses interprovinciales. Está diseñada para operar en un modelo multi-tenant (cooperativas). Soporta roles (cliente, admin, oficinista, chofer, superadmin) y se integra con servicios externos (PayPal, Brevo/email). El frontend consume una API REST (endpoints `/api/*`) y se apoya en sockets para el motor de asientos en tiempo real.

Objetivos principales:
- Facilitar la búsqueda y compra de tickets por usuario final.
- Permitir gestión administrativa (rutas, frecuencias, buses, viajes).
- Proporcionar herramientas operativas (manifiesto de chofer, registro de gastos).

---

## 2) Variables de entorno (lista recomendada)

Coloca estas variables en `.env` en la raíz:

- `VITE_API_URL` — URL base de la API (ej. `http://localhost:3000/api`)
- `VITE_PAYPAL_CLIENT_ID` — client id de PayPal (sandbox/prod)
- `VITE_ANALYTICS_ID` — (opcional) ID para analytics
- `VITE_APP_ENV` — `development` / `production`

Nota: No incluyas secrets sensibles en repositorios públicos.

---

## 3) Comandos útiles (PowerShell)

```powershell
# Instalar dependencias
npm install

# Desarrollo (Vite)
npm run dev

# Build producción
npm run build

# Previsualizar build
npm run preview
```

Si prefieres `yarn` o `pnpm` cambia los comandos por `yarn` / `pnpm install` y los scripts equivalentes.

---

## 4) Estructura detallada del proyecto

Explicación de carpetas y archivos clave (raíz `src/`):

- `src/components/` — Componentes organizados por área:
	- `public/`: componentes públicos como `TripSearch.jsx`, `SeatMap.jsx`, `TripSelection`.
	- `admin/`: componentes para panel administrativo (`AdminSeatMap.jsx`, `AdminSidebar.jsx`, `SeatDesigner.jsx`).
	- `ui/`: componentes de UI reutilizables (botones, inputs, dialogs, tabla, selects). Estos son wrappers sobre shadcn/ui.

- `src/pages/` — Rutas principales agrupadas por roles:
	- `pages/Home.jsx`, `Login.jsx`, `Register.jsx`, `MyTickets.jsx`, `Profile.jsx`.
	- `pages/admin/`: gestión completa (BusesManagement, RoutesManagement, TripsManagement, TicketsManagement, ReportsManagement, etc.).
	- `pages/driver/`: manifiestos y flujos para chofer (`MyTrips.jsx`, `Manifest.jsx`).
	- `pages/oficinista/`: ventas en taquilla (`VenderTicket.jsx`, `MisVentas.jsx`).

- `src/services/` — Cliente `api.js` (Axios configurado) y `index.js` con servicios agrupados:
	- `tripService`: `search`, `getAll`, `getById`, `getPublicById`.
	- `ticketService`: `create`, `reserveSeat`, `myTickets`, etc.

- `src/contexts/AuthContext.jsx` — Provee `useAuth()` y manejo de token/usuario y roles.
- `src/hooks/` — Hooks propios (ej. `useActiveCooperativaId.js`, `usePermissions.js`).
- `src/lib/` — `constants.js`, `utils.js` con helpers (formateo de fecha, normalización de objetos, parse de parada/itinerario).
- `src/utils/` — `errorHandlers.js` (manejadores de errores comunes y adaptadores de mensajes para UI).

Archivos de configuración importantes:
- `vite.config.js` — proxy de desarrollo y configuraciones del bundler.
- `tailwind.config.js` — rutas a contenido, plugins, tema.
- `postcss.config.js` — configuración PostCSS.

---

## 5) Flujo de datos y componentes clave

Describo los flujos más relevantes y dónde intervenir si necesitas cambios:

- Búsqueda de viajes (Home → `TripSearch.jsx`):
	- Input: origen, destino, fecha, filtros.
	- Llama a `tripService.search` (`GET /trips/search`) para resultados públicos.
	- Si el backend no devuelve coincidencias esperadas por paradas intermedias, el componente aplica normalización y un fallback que llama a `tripService.getAll` y realiza filtrado cliente por secuencia de paradas.
	- Resultado: lista de `trips` normalizados (precio, capacidad, departureTime, status).

- Selección y compra (SeatSelection → Checkout):
	- Seleccionar butaca bloquea temporalmente el asiento via socket (backend).
	- Reserva y pago: `ticketService.reserveSeat` → iniciar pago PayPal `POST /tickets/payment/paypal/initiate` → completar con `execute`.

- Crear Ticket Manual (admin/oficinista → `TicketsManagement.jsx`):
	- Flujo: elegir frecuencia → ver fechas futuras con viajes en `SCHEDULED` → seleccionar viaje → cargar buses asociados a ese viaje (`GET /trips/:id`) → seleccionar bus y asiento → crear ticket.
	- Cambios recientes en el código hacen que el selector de buses muestre solo buses asignados al viaje/fecha seleccionado.

- Vista Chofer (`MyTrips.jsx`, `Manifest.jsx`):
	- `MyTrips.jsx` filtra viajes para mostrar solo los viajes asignados al chofer autenticado (cliente con rol CHOFER).
	- `Manifest.jsx` consume `GET /operations/manifest/:tripId` para mostrar pasajeros con tickets validados.

---

## 6) Endpoints relevantes (resumen)

Estos endpoints están documentados en el backend; el frontend asume las rutas:

- Autenticación: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/verify-email`.
- Trips públicos: `GET /api/trips/search`, `GET /api/trips`, `GET /api/trips/:id`, `GET /api/trips/public/:id`.
- Tickets: `POST /api/tickets`, `POST /api/tickets/reserve-seat`, `GET /api/tickets/my-tickets`, `GET /api/tickets/seat-map/:tripId`.
- Operaciones: `POST /api/operations/validate-qr`, `GET /api/operations/manifest/:tripId`.

Si extiendes servicios en `src/services/index.js`, mantén los nombres de funciones consistentes (`tripService.search`, `ticketService.create`, etc.).

---

## 7) Autenticación y Roles

- El `AuthContext` guarda `accessToken` y `currentUser`.
- Las rutas protegidas usan `ProtectedRoute.jsx` que verifica roles y redirige cuando no hay permisos.
- Roles: `SUPER_ADMIN`, `ADMIN`, `OFICINISTA`, `CHOFER`, `CLIENTE`.

Recomendación: para pruebas rápidas crea usuarios desde `prisma/seed.ts` (backend). Para probar permisos, inicia sesión con cada rol y verifica vistas disponibles.



## 8) Manejo de fechas y zona horaria

- Algunas comparaciones utilizan la zona `America/Guayaquil` (UTC-5). Para evitar errores de cálculo, normaliza fechas del backend a ISO y presenta localmente con `date-fns`.
- En `TicketsManagement.jsx` se usa lógica para filtrar solo viajes futuros con estado `SCHEDULED` antes de mostrar fechas disponibles.




## 9) Buenas prácticas de desarrollo

- Centralizar llamadas a API en `src/services/`.
- Mantener componentes UI puros y delegar lógica en hooks o servicios.
- Documentar nuevos endpoints y actualizar `src/services/index.js`.
- Evitar manipular estado global en operaciones asíncronas (usar variables locales y update único de estado).


## 10) Cómo contribuir (plantilla PR)

Usa Conventional Commits y sigue este template en el PR:

```
Resumen:
- Qué hace este PR:

Cómo probar:
1. Paso 1
2. Paso 2

Notas:
- Migraciones: sí/no (comando)
- Dependencias nuevas: paquete X

Issue relacionado: #
```


---

# Contacto y soporte: 
`Davidl2002` — `dl735894@gmail.com`

 

