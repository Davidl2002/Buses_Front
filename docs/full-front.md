# Visión general del Frontend - MoviPass

Esta página resume lo más importante del frontend: estructura, scripts, dependencias clave, flujo de autenticación, servicios de API, componentes principales y acciones para ejecutar, debuggear y desplegar.

---

## Resumen rápido

- Framework: React 18 (Vite como bundler).
- Estilo: Tailwind CSS.
- Documentación: VitePress (en `docs/`).
- API base: `http://localhost:3000/api` (configurado en `src/services/api.js`).

---

## Scripts principales (en la raíz, `package.json`)

- `npm run dev` — Levanta la app en modo desarrollo (Vite).
- `npm run build` — Build de producción.
- `npm run preview` — Previsualizar build.
- `npm run docs:dev` — Levantar la documentación (VitePress).
- `npm run docs:build` — Generar docs estáticas.

---

## Estructura principal del proyecto

Carpeta `src/` (resumen):

- `main.jsx` — Punto de entrada React.
- `App.jsx` — Rutas y layout global.
- `components/` — Componentes reutilizables y por sección:
  - `components/ui/` — Botones, inputs, selects, badges, cards, etc.
  - `components/layout/` — `Header.jsx`, `Footer.jsx`.
  - `components/public/` — Componentes públicos: `TripSearch.jsx`, `SeatMap.jsx`, `SeatSelection.jsx`.
  - `components/admin/` — Panel de administración.
- `contexts/` — Contextos React; **`AuthContext.jsx`** maneja login, logout, persistencia en `localStorage` y carga inicial del usuario.
- `services/` — Lógica de comunicación con API (axios). Claves:
  - `api.js` — instancia axios, interceptores (agrega token y maneja 401).
  - `index.js` — colección de servicios: `authService`, `tripService`, `ticketService`, `cooperativaService`, etc.
- `pages/` — Páginas que usan componentes: `Home.jsx`, `Login.jsx`, `Register.jsx`, `MyTickets.jsx`, y carpetas `admin/`, `driver/`, `superadmin/`.
- `utils/`, `lib/`, `hooks/` — utilidades, constantes y hooks personalizados (`usePermissions.js`).

---

## Dependencias clave

- `react`, `react-dom` — biblioteca UI.
- `vite` — bundler/dev server.
- `tailwindcss` — utilidades CSS.
- `axios` — HTTP client (configurado en `src/services/api.js`).
- `react-router-dom` — routing.
- `react-hot-toast` — notificaciones.
- `lucide-react` — iconos.

---

## Flujo de autenticación y token

- El login se realiza con `authService.login(credentials)` (ver `src/services/index.js`).
- La instancia de axios en `src/services/api.js` añade automáticamente `Authorization: Bearer <token>` si hay `token` en `localStorage`.
- `AuthContext` guarda `token` y `user` en `localStorage` tras un login o registro.
- Si una petición autenticada devuelve 401 y la petición tenía `Authorization`, el interceptor elimina `token` y `user` de `localStorage` y redirige a `/login`.

Recomendaciones:
- Asegúrate de que el backend coincida en ruta y formato del payload (el frontend envía `{ email, password }` por defecto).
- Para debug de 401: revisar Network en DevTools, request payload y response body (mensaje del backend).

---

## Servicios y endpoints importantes

- `GET /trips/cities/origins` — Orígenes disponibles (usado en `TripSearch`).
- `GET /trips/cities/destinations?origin=...` — Destinos para un origen.
- `GET /trips/dates/available?origin=...&destination=...` — Fechas disponibles.
- `POST /auth/login` — Login.
- `POST /tickets` — Crear ticket / reserva.
- `GET /tickets/seat-map/:tripId` — Mapa de asientos.

Todos los servicios están centralizados en `src/services/index.js`.

---

## Componentes críticos y qué hacen

- `src/components/public/TripSearch.jsx` — Busca viajes, usa `sessionStorage` para cachear `originCities` y `destinationCities`. Maneja fallback cuando endpoints no devuelven datos.
- `src/components/public/SeatSelection.jsx` — Interfaz para elegir asientos y comenzar reserva.
- `src/components/public/SeatMap.jsx` — Muestra layout del bus y asientos ocupados.
- UI atoms (`src/components/ui/*`) — Reutilizar en todo el proyecto; si cambias su API afectas varias páginas.
- `src/contexts/AuthContext.jsx` — Estado global de autenticación y helpers `login`, `logout`, `register`.

---

## Notas de debugging y problemas conocidos

- `sessionStorage` puede contener arrays vacíos (`[]`) que antes bloqueaban la carga: revisar `TripSearch.jsx` para asegurarse de ignorar arrays vacíos (ya corregido en el código actual).
- Si `POST /api/auth/login` devuelve 401, posibles causas:
  - Credenciales inválidas.
  - Backend no corriendo en `http://localhost:3000`.
  - Backend espera otros nombres de campo (p.ej. `username` en vez de `email`).
  - CORS o cabeceras incorrectas.

Pasos para reproducir y depurar:
1. Abrir DevTools → Network → realizar login.
2. Seleccionar la petición `POST /api/auth/login` y revisar Request Payload (¿email/password?) y Response (mensaje de error del backend).
3. Probar con curl/Postman para aislar frontend/backend.

---

## Cómo ejecutar localmente (PowerShell)

Instalar dependencias:

```powershell
npm install
```

Levantar frontend:

```powershell
npm run dev
```

Levantar documentación:

```powershell
npm run docs:dev
```

Construir producción:

```powershell
npm run build
```

---

## Buenas prácticas y sugerencias rápidas

- Mantener `services/api.js` como único lugar para configurar la baseURL y manejo de tokens.
- Documentar cada componente `ui` con ejemplos en `docs/components` (puedo generar plantillas).
- Añadir validaciones y mensajes de error amigables en `Login.jsx` y mostrar detalles deviales cuando se ejecuta en `development`.
- Añadir tests unitarios (Jest + React Testing Library) para `TripSearch`, `SeatSelection`, y `AuthContext`.

---

## Próximos pasos que puedo hacer por ti

- Generar automáticamente páginas de docs para cada componente en `src/components/ui/` con snippets de uso.
- Integrar Storybook para ver componentes en aislamiento.
- Añadir una sección en docs con ejemplos de llamadas a la API (curl/Postman) y scripts de prueba.

Si quieres, genero ahora la documentación automática para los componentes UI (`button`, `input`, `card`, `select`) con ejemplos de uso.
