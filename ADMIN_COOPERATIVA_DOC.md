# 👔 Admin de Cooperativa - Documentación

## Descripción General

El **Admin de Cooperativa** es el rol más complejo del sistema. Es el gerente que opera el sistema para su empresa específica de transporte interprovincial. Tiene acceso completo a la gestión de su cooperativa pero no puede ver datos de otras cooperativas.

---

## 🎯 Funcionalidades Implementadas

### A. Configuración e Identidad (`/admin/cooperativa-settings`)

**Componente:** `CooperativaSettings.jsx`

Permite personalizar la identidad visual de la cooperativa:

#### ✅ Características:
- **Logo**: Subir imagen (PNG/JPG, máx 2MB) con vista previa en tiempo real
- **Colores Corporativos**:
  - Color Primario (selector visual + input hex)
  - Color Secundario (selector visual + input hex)
  - Vista previa de colores aplicados
- **Redes Sociales**:
  - Facebook URL
  - Instagram URL
  - Twitter/X URL
  - WhatsApp (número de contacto)

#### 🔌 API Endpoints Utilizados:
- `GET /api/cooperativas/:id` - Obtener configuración actual
- `PUT /api/cooperativas/:id` - Actualizar configuración con objeto `config`

---

### B. Gestión de Flota (`/admin/buses`)

**Componentes:** 
- `BusesManagement.jsx` (ya existente, mejorado)
- `SeatDesigner.jsx` (nuevo componente)

#### ✅ CRUD de Buses:
- Crear/Editar/Eliminar buses
- Campos completos: placa, marca, modelo, año, chasis, número interno
- Servicios: A/C, WiFi, Baño, TV
- Estados: ACTIVE, MAINTENANCE, INACTIVE
- Asignación a grupos de buses

#### 🎨 Diseñador de Asientos Visual:
- **Configuración flexible**:
  - Número de filas (5-15)
  - Número de columnas (3-5)
  - Soporte para buses de 2 pisos
- **Tipos de asientos**:
  - Normal (precio base ×1.0) - Azul
  - VIP (precio ×1.5) - Morado
  - Semi Cama (precio ×1.3) - Verde
- **Interacción**:
  - Click para cambiar tipo de asiento
  - Click en X para eliminar asiento
  - Click en espacio vacío para agregar asiento
  - Visualización del conductor y pasillos
  - Contador en tiempo real por tipo
- **Pasillo automático** en columna central
- **Numeración automática** de asientos

#### 🔌 API Endpoints:
- `POST /api/buses` - Crear bus con `seatLayout`
- `GET /api/buses` - Listar buses (solo de su cooperativa)
- `GET /api/buses/:id` - Obtener detalles
- `PUT /api/buses/:id` - Actualizar (incluyendo estado)
- `DELETE /api/buses/:id` - Eliminar bus

---

### C. Logística y Rutas (`/admin/frequencies`)

**Componente:** `FrequenciesManagement.jsx`

#### ✅ Frecuencias ANT:
Gestión de frecuencias autorizadas por la Agencia Nacional de Tránsito:

- **Registro de frecuencias**:
  - Selección de ruta (origen-destino)
  - Hora de salida
  - Días de operación (L-D con checkboxes visuales)
  - Asignación a grupo de buses
- **Estadísticas**:
  - Total de frecuencias
  - Rutas activas
  - Frecuencias diarias (7 días/semana)
  - Grupos de buses

#### 🗓️ Planificación Automática:
- **Generación de Viajes**: 
  - Genera automáticamente viajes para un rango de fechas
  - Respeta días de operación configurados
  - Detecta conflictos (más frecuencias que buses)
  - Sugiere soluciones (días de parada)
  
#### 🔌 API Endpoints:
- `POST /api/frequencies` - Crear frecuencia ANT
- `GET /api/frequencies` - Listar frecuencias
- `PUT /api/frequencies/:id` - Actualizar
- `DELETE /api/frequencies/:id` - Eliminar
- `POST /api/frequencies/generate-trips` - Generar viajes automáticamente
  ```json
  {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
  ```

---

### D. Gestión de Personal (`/admin/staff`)

**Nota:** Utiliza el componente `StaffManagement.jsx` existente, pero con restricciones:

#### ✅ Características:
- El ADMIN solo puede crear:
  - **OFICINISTAS** (personal de ventas)
  - **CHOFERES** (operadores)
- **NO** puede crear otros ADMINs
- Solo ve personal de **su cooperativa**
- Asignación de choferes a buses específicos (opcional)

#### 🔌 API Endpoints:
Los mismos endpoints de staff pero filtrados automáticamente por `cooperativaId`:
- `POST /api/staff` (con `cooperativaId` inyectado)
- `GET /api/staff?cooperativaId=X`
- `PUT /api/staff/:id`
- `DELETE /api/staff/:id`

---

### E. Dashboard y Reportes Financieros (`/admin/cooperativa-dashboard`)

**Componente:** `CooperativaDashboard.jsx`

Dashboard completo con métricas financieras y operativas:

#### 📊 Estadísticas Principales:
- **Ventas del Período**: Monto total + tickets vendidos
- **Ganancia Neta**: Con margen de ganancia %
- **Buses Activos**: Activos vs total
- **Viajes Completados**: Completados vs en curso

#### 💰 Reporte Financiero (Tab 1):
- **Ingresos** desglosados por método:
  - Efectivo
  - PayPal
  - Transferencias bancarias
- **Gastos** por categoría:
  - Combustible
  - Peajes
  - Mantenimiento
  - Otros
- **Resumen de Tickets** por estado (PAID, USED, CANCELLED)

#### 🚌 Balance por Bus (Tab 2):
Tabla con rendimiento de cada unidad:
- Placa y modelo
- Número de viajes realizados
- Ingresos generados
- Gastos registrados
- **Ganancia neta** por bus

#### 💳 Pagos Pendientes (Tab 3):
Lista de transferencias bancarias pendientes de verificación:
- Número de ticket
- Datos del pasajero
- Monto
- Botones de acción:
  - ✅ **Aprobar** pago
  - ❌ **Rechazar** con nota opcional

#### 👥 Personal (Tab 4):
- Contador de oficinistas
- Contador de choferes
- Total de personal
- Enlaces rápidos a gestión de staff

#### 🔌 API Endpoints:
```javascript
// Dashboard general
GET /api/dashboard/cooperativa?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

// Reporte financiero detallado
GET /api/dashboard/financial-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

// Balance por bus
GET /api/dashboard/balance-by-bus?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

// Pagos pendientes
GET /api/dashboard/pending-payments

// Aprobar/Rechazar pago
PUT /api/dashboard/payment/:ticketId
{
  "status": "APPROVED | REJECTED",
  "adminNotes": "string (opcional)"
}
```

---

## 🎨 Navegación Actualizada

### AdminSidebar.jsx
El sidebar ahora se adapta según el rol del usuario:

#### Para ADMIN de Cooperativa:
1. **Dashboard** → `/admin/cooperativa-dashboard`
2. **Configuración** → `/admin/cooperativa-settings` (logo, colores)
3. **Rutas** → `/admin/routes`
4. **Frecuencias ANT** → `/admin/frequencies` ⭐ NUEVO
5. **Buses** → `/admin/buses` (con diseñador de asientos)
6. **Viajes** → `/admin/trips`
7. **Personal** → `/admin/staff`
8. **Tickets** → `/admin/tickets`
9. **Reportes** → `/admin/reports`

#### Para SUPER_ADMIN:
- Dashboard Global
- Cooperativas (gestión)
- Acceso a todas las secciones de todas las cooperativas

#### Para OFICINISTA:
- Solo Viajes y Tickets

---

## 🔐 Diferencias con SUPER_ADMIN

| Característica | SUPER_ADMIN | ADMIN |
|---|---|---|
| **Alcance de Datos** | Global (todas cooperativas) | Solo su cooperativa |
| **Crear Cooperativas** | ✅ Sí | ❌ No |
| **Editar Cooperativa** | ✅ Cualquiera | ⚠️ Solo la suya |
| **Crear Usuarios** | ✅ Crea otros ADMINs | ⚠️ Solo OFICINISTAS y CHOFERES |
| **Dashboard Global** | ✅ Acceso completo | ❌ No tiene acceso |
| **Dashboard Cooperativa** | ✅ Ve cualquiera | ✅ Solo la suya |
| **Reportes Financieros** | ❌ No accede | ✅ Completos de su coop |
| **Aprobar Pagos** | ❌ No le incumbe | ✅ De su cooperativa |
| **Personalización** | ❌ No configura | ✅ Logo, colores, RRSS |

---

## 📱 Tecnologías Utilizadas

### Frontend:
- **React 18** con Hooks
- **React Router DOM** para navegación
- **Tailwind CSS** para estilos
- **Shadcn/ui** componentes
- **Lucide React** iconos
- **React Hot Toast** notificaciones

### Componentes Principales:
```
src/
├── pages/admin/
│   ├── CooperativaSettings.jsx       ⭐ NUEVO
│   ├── CooperativaDashboard.jsx      ⭐ NUEVO
│   ├── FrequenciesManagement.jsx     ⭐ NUEVO
│   ├── BusesManagement.jsx           ✏️ MEJORADO
│   └── ...
├── components/admin/
│   ├── SeatDesigner.jsx              ⭐ NUEVO
│   ├── AdminSidebar.jsx              ✏️ ACTUALIZADO
│   └── AdminLayout.jsx               ✏️ ACTUALIZADO
```

---

## 🚀 Próximos Pasos

### Funcionalidades Pendientes:
1. **Exportación de reportes** a PDF/Excel
2. **Notificaciones push** para pagos pendientes
3. **Gráficos interactivos** en dashboard (Chart.js / Recharts)
4. **Historial de cambios** en configuración
5. **Backup automático** de diseños de asientos
6. **Aplicación de temas** con colores de cooperativa en toda la app
7. **Sistema de auditoría** de cambios

### Integraciones Sugeridas:
- **Email** para notificaciones a choferes
- **SMS** para recordatorios de viajes
- **WhatsApp Business API** para atención al cliente
- **Pasarelas de pago** adicionales (Stripe, local banks)

---

## 📖 Guía de Uso Rápida

### Para un Admin nuevo:

1. **Primero:** Configura tu cooperativa
   - Ve a "Configuración"
   - Sube el logo
   - Define colores corporativos
   - Agrega redes sociales

2. **Segundo:** Registra tu flota
   - Ve a "Buses"
   - Crea cada bus con sus datos
   - Diseña la distribución de asientos
   - Marca tipo de asiento (Normal/VIP/Semi-cama)

3. **Tercero:** Define frecuencias ANT
   - Ve a "Frecuencias ANT"
   - Registra cada frecuencia autorizada
   - Asigna días de operación
   - Genera viajes automáticamente

4. **Cuarto:** Gestiona personal
   - Ve a "Personal"
   - Crea usuarios OFICINISTAS
   - Crea usuarios CHOFERES
   - Asigna permisos

5. **Monitorea:** Dashboard diario
   - Revisa ventas del día
   - Aprueba pagos pendientes
   - Revisa balance por bus
   - Exporta reportes

---

## 🐛 Troubleshooting

### Problema: No veo las nuevas rutas
**Solución:** Verifica que el usuario tenga rol `ADMIN` y esté autenticado correctamente.

### Problema: Error al subir logo
**Solución:** 
- Verifica que el archivo sea PNG o JPG
- No exceda 2MB
- El backend debe aceptar base64 en el campo `config.logo`

### Problema: No se generan viajes
**Solución:**
- Verifica que existan frecuencias registradas
- Verifica que haya buses disponibles
- Revisa que las fechas sean válidas

### Problema: No puedo aprobar pagos
**Solución:** Solo el ADMIN de la cooperativa puede aprobar pagos. SUPER_ADMIN no tiene acceso a esta funcionalidad.

---

## 📞 Soporte

Para dudas o problemas:
1. Revisa la documentación del API en `api_back.md`
2. Consulta ejemplos en `EXAMPLES.md`
3. Revisa el código de los componentes

**Versión:** 1.0.0  
**Fecha:** Noviembre 2025  
**Autor:** Equipo MoviPass
