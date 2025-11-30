Write-Host "Iniciando MoviPass Frontend..." -ForegroundColor Cyan
Write-Host ""

# Verificar si node_modules existe
if (-Not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    npm install -D tailwindcss-animate
    Write-Host "Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
}

# Iniciar el servidor de desarrollo
Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Green
Write-Host "La aplicación estará disponible en: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

npm run dev
