# Rutas y Hoja de Ruta

Resumen de endpoints relacionados con rutas, frecuencias y la nueva "Hoja de Ruta".

## Endpoint nuevo: Obtener Hoja de Ruta

GET /api/trips/route-sheet

Parámetros (query):
- `groupId` (obligatorio): ID del grupo de buses.
- `date=YYYY-MM-DD` (opcional): fecha concreta para la hoja del día.
- `startDate=YYYY-MM-DD` y `endDate=YYYY-MM-DD` (opcional): rango de fechas.

Autorización: requiere token Bearer y rol `ADMIN` o `SUPER_ADMIN`.

Respuesta: JSON agrupado por fechas. Estructura resumida:

{
  "success": true,
  "data": {
    "groupId": "...",
    "groupName": "Grupo A",
    "dates": [
      {
        "date": "2025-12-01",
        "buses": [
          {
            "bus": { "id":"...", "numeroInterno":"001", "placa":"ABC-123" },
            "trips": [
              { "id":"...", "departureTime":"08:00", "route": {...}, "passengersCount": 12, "driver": {"id":"..","name":"..."}, "assistant": {"id":"..","name":"..."}, "status":"CONFIRMED" }
            ]
          }
        ]
      }
    ]
  }
}

Notas:
- La respuesta está pensada para mostrar la hoja de ruta por fechas y por cada bus del grupo sus viajes del día.
- Los campos comunes: `departureTime`, `route` (objeto con al menos `id` y `name`), `passengersCount`, `driver`, `assistant`, `status`, `notes`.

## Ejemplos de uso (cURL)

Hoja de ruta para un día (por grupo):

```bash
curl "http://localhost:3000/api/trips/route-sheet?date=2025-12-01&groupId=<BUSGROUP_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

Hoja de ruta para un rango de fechas:

```bash
curl "http://localhost:3000/api/trips/route-sheet?startDate=2025-12-01&endDate=2025-12-07&groupId=<BUSGROUP_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

## Endpoints relacionados
- GET /api/trips/route-sheet?date=&groupId= (nuevo — hoja por día o rango)
- GET /api/trips?date=YYYY-MM-DD (lista todos los viajes del sistema para la fecha — filtrable por `busId`, `routeId`)
- GET /api/trips/:id (detalle del viaje)
- GET /api/trips/:id/seats (layout y asientos ocupados — pública)
- GET /api/frequencies/:id (la frecuencia incluye algunos trips futuros)
- POST /api/frequencies/generate-trips (genera viajes automáticamente desde frecuencias; evita solapamientos y aplica límites)

### Endpoints adicionales útiles
- GET /api/trips/cities/origins
- GET /api/trips/cities/destinations
- GET /api/trips/dates/available

## Recomendaciones
- La API de `route-sheet` está pensada para uso administrativo; asegúrese de pasar `groupId` válido.
- Para rangos extensos, el payload puede ser grande; preferir paginación/consultas por rangos cortos si el backend lo soporta.
- El frontend debe validar que se pase `groupId` y al menos una fecha o rango.

---

Documentación generada el: 29-11-2025
