# 📘 Ejemplos de Uso de la API - MoviPass

Ejemplos prácticos para probar la API usando PowerShell.

## 🔐 1. Autenticación

### Login como Admin
```powershell
$loginBody = @{
    email = "admin@transchimborazo.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

# Guardar el token
$token = $response.data.token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "✅ Token obtenido: $token"
```

### Registro de Cliente
```powershell
$registerBody = @{
    email = "nuevo@cliente.com"
    password = "Cliente123!"
    firstName = "Pedro"
    lastName = "Silva"
    phone = "0987654321"
    cedula = "1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
```

### Ver Mi Perfil
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method GET -Headers $headers
```

## 🏢 2. Cooperativas

### Listar Cooperativas
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/cooperativas" -Method GET -Headers $headers
```

### Crear Cooperativa (SuperAdmin)
```powershell
$coopBody = @{
    nombre = "Expreso Tungurahua"
    ruc = "1122334455001"
    email = "info@expresotungurahua.com"
    phone = "032-123456"
    address = "Av. Principal, Ambato"
    config = @{
        logo = ""
        primaryColor = "#FF5722"
        secondaryColor = "#3F51B5"
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/cooperativas" -Method POST -Body $coopBody -Headers $headers
```

## 🚌 3. Buses

### Crear Bus
```powershell
$busBody = @{
    cooperativaId = "id-de-tu-cooperativa"
    placa = "PBA-9999"
    marca = "Hino"
    modelo = "AK8"
    year = 2023
    numeroInterno = "003"
    totalSeats = 36
    seatLayout = @{
        rows = 9
        columns = 4
        seats = @(
            @{ number = 1; row = 0; col = 0; type = "VIP"; isAvailable = $true }
            @{ number = 2; row = 0; col = 1; type = "VIP"; isAvailable = $true }
            # ... más asientos
        )
    }
    hasAC = $true
    hasWifi = $true
    hasBathroom = $false
    hasTV = $true
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/api/buses" -Method POST -Body $busBody -Headers $headers
```

### Listar Buses
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/buses" -Method GET -Headers $headers
```

### Crear Grupo de Buses
```powershell
$groupBody = @{
    name = "Flota Norte"
    description = "Buses para rutas al norte del país"
    cooperativaId = "id-de-tu-cooperativa"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/buses/groups" -Method POST -Body $groupBody -Headers $headers
```

## 🛣️ 4. Rutas

### Crear Ruta
```powershell
$rutaBody = @{
    cooperativaId = "id-de-tu-cooperativa"
    name = "Cuenca - Guayaquil"
    origin = "Cuenca"
    destination = "Guayaquil"
    basePrice = 6.50
    estimatedDuration = 240
    distanceKm = 243
    stops = @(
        @{ name = "Azogues"; order = 1; priceFromOrigin = 1.50 }
        @{ name = "Cañar"; order = 2; priceFromOrigin = 2.50 }
        @{ name = "La Troncal"; order = 3; priceFromOrigin = 4.00 }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/routes" -Method POST -Body $rutaBody -Headers $headers
```

### Listar Rutas
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/routes" -Method GET -Headers $headers
```

## ⏰ 5. Frecuencias

### Crear Frecuencia
```powershell
$frecuenciaBody = @{
    cooperativaId = "id-de-tu-cooperativa"
    routeId = "id-de-tu-ruta"
    busGroupId = "id-de-tu-grupo"
    departureTime = "07:30"
    operatingDays = @("MONDAY", "WEDNESDAY", "FRIDAY")
    antPermitNumber = "ANT-2024-999"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/frequencies" -Method POST -Body $frecuenciaBody -Headers $headers
```

### Generar Viajes
```powershell
$generateBody = @{
    startDate = "2024-12-01"
    endDate = "2024-12-31"
    frequencyIds = @("id-frecuencia-1", "id-frecuencia-2")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/frequencies/generate-trips" -Method POST -Body $generateBody -Headers $headers
```

## 🗓️ 6. Viajes

### Buscar Viajes (Público - sin token)
```powershell
$searchParams = @{
    origin = "Riobamba"
    destination = "Quito"
    date = "2024-12-25"
    hasAC = "true"
    hasWifi = "true"
}

$queryString = ($searchParams.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
Invoke-RestMethod -Uri "http://localhost:3000/api/trips/search?$queryString" -Method GET
```

### Ver Mapa de Asientos
```powershell
$tripId = "id-del-viaje"
Invoke-RestMethod -Uri "http://localhost:3000/api/tickets/seat-map/$tripId" -Method GET
```

### Listar Viajes
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/trips" -Method GET -Headers $headers
```

### Asignar Personal a Viaje
```powershell
$personnelBody = @{
    driverId = "id-del-chofer"
    assistantId = "id-del-ayudante"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/trips/$tripId/personnel" -Method PATCH -Body $personnelBody -Headers $headers
```

## 🎫 7. Tickets

### Reservar Asiento
```powershell
$reserveBody = @{
    tripId = "id-del-viaje"
    seatNumber = 15
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tickets/reserve-seat" -Method POST -Body $reserveBody -ContentType "application/json"
```

### Crear Ticket (Pago en Efectivo)
```powershell
$ticketBody = @{
    tripId = "id-del-viaje"
    passengerName = "Juan Pérez"
    passengerCedula = "1234567890"
    passengerEmail = "juan@email.com"
    passengerPhone = "0987654321"
    seatNumber = 15
    boardingStop = "Riobamba"
    dropoffStop = "Quito"
    paymentMethod = "CASH"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tickets" -Method POST -Body $ticketBody -Headers $headers
```

### Ver Mis Tickets
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tickets/my-tickets" -Method GET -Headers $headers
```

### Iniciar Pago con PayPal
```powershell
$paypalBody = @{
    ticketId = "id-del-ticket"
} | ConvertTo-Json

$paypalResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/tickets/payment/paypal/initiate" -Method POST -Body $paypalBody -Headers $headers

Write-Host "URL de aprobación PayPal: $($paypalResponse.data.approvalUrl)"
```

### Cancelar Ticket
```powershell
$ticketId = "id-del-ticket"
Invoke-RestMethod -Uri "http://localhost:3000/api/tickets/$ticketId/cancel" -Method PATCH -Headers $headers
```

## 🔍 8. Operaciones

### Validar QR
```powershell
$qrBody = @{
    qrCode = "codigo-qr-del-ticket"
    tripId = "id-del-viaje"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/operations/validate-qr" -Method POST -Body $qrBody -Headers $headers
```

### Ver Manifiesto de Pasajeros
```powershell
$tripId = "id-del-viaje"
Invoke-RestMethod -Uri "http://localhost:3000/api/operations/manifest/$tripId" -Method GET -Headers $headers
```

### Registrar Gasto
```powershell
$expenseBody = @{
    tripId = "id-del-viaje"
    type = "FUEL"
    description = "Tanqueada en Ambato"
    amount = 45.50
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/operations/expenses" -Method POST -Body $expenseBody -Headers $headers
```

### Ver Gastos de un Viaje
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/operations/expenses/$tripId" -Method GET -Headers $headers
```

### Reporte de Ganancias por Viaje
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/operations/reports/trip/$tripId" -Method GET -Headers $headers
```

### Reporte de Ganancias de Cooperativa
```powershell
$reportParams = @{
    cooperativaId = "id-de-cooperativa"
    startDate = "2024-12-01"
    endDate = "2024-12-31"
}

$queryString = ($reportParams.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
Invoke-RestMethod -Uri "http://localhost:3000/api/operations/reports/cooperativa?$queryString" -Method GET -Headers $headers
```

## 👥 9. Gestión de Staff

### Crear Oficinista
```powershell
$staffBody = @{
    email = "nuevo.oficinista@cooperativa.com"
    password = "Oficina123!"
    firstName = "María"
    lastName = "Torres"
    cedula = "0987654321"
    phone = "0991234567"
    role = "OFICINISTA"
    cooperativaId = "id-de-tu-cooperativa"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/staff" -Method POST -Body $staffBody -Headers $headers
```

### Crear Chofer
```powershell
$choferBody = @{
    email = "nuevo.chofer@cooperativa.com"
    password = "Chofer123!"
    firstName = "Carlos"
    lastName = "Ramírez"
    cedula = "1122334455"
    phone = "0987654321"
    role = "CHOFER"
    cooperativaId = "id-de-tu-cooperativa"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/staff" -Method POST -Body $choferBody -Headers $headers
```

## 💡 Tips

### Guardar respuestas en variables
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/cooperativas" -Method GET -Headers $headers
$cooperativaId = $response.data[0].id
Write-Host "ID de cooperativa: $cooperativaId"
```

### Ver respuesta formateada
```powershell
$response | ConvertTo-Json -Depth 5
```

### Manejar errores
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/buses" -Method GET -Headers $headers
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
}
```

## 🔥 Script Completo de Prueba

```powershell
# 1. Login
$loginBody = @{
    email = "admin@transchimborazo.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.data.token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "✅ Login exitoso"

# 2. Listar cooperativas
$cooperativas = Invoke-RestMethod -Uri "http://localhost:3000/api/cooperativas" -Method GET -Headers $headers
Write-Host "📋 Cooperativas encontradas: $($cooperativas.data.Count)"

# 3. Listar buses
$buses = Invoke-RestMethod -Uri "http://localhost:3000/api/buses" -Method GET -Headers $headers
Write-Host "🚌 Buses encontrados: $($buses.data.Count)"

# 4. Buscar viajes
$mañana = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$viajes = Invoke-RestMethod -Uri "http://localhost:3000/api/trips/search?origin=Riobamba&destination=Quito&date=$mañana" -Method GET
Write-Host "🗓️ Viajes disponibles: $($viajes.data.Count)"

Write-Host "✨ Prueba completada exitosamente!"
```

---
