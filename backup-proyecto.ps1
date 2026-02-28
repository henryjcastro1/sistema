# Configuración
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "Z:\Proyectos completos\backups-demo1"
$proyectoDir = "Z:\Proyectos completos\demo1-app"

# Crear carpeta de backups si no existe
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

Write-Host "📦 INICIANDO BACKUP COMPLETO" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# 1. Backup de la base de datos
Write-Host "`n1️⃣  Respaldando base de datos..." -ForegroundColor Yellow
$dbBackup = "$backupDir\db_$fecha.sql"
docker exec demo1_db pg_dump -U helpdeskuser -d demo1 > $dbBackup
Write-Host "✅ Base de datos guardada en: $dbBackup" -ForegroundColor Green

# 2. Backup del código (excluyendo node_modules)
Write-Host "`n2️⃣  Respaldando código fuente..." -ForegroundColor Yellow
$codeBackup = "$backupDir\codigo_$fecha"
$codeZip = "$backupDir\codigo_$fecha.zip"

# Crear carpeta temporal
New-Item -ItemType Directory -Path $codeBackup -Force

# Copiar archivos (excluyendo node_modules y .next)
Copy-Item -Path "$proyectoDir\*" -Destination $codeBackup -Recurse -Exclude @("node_modules", ".next", "docker/data")

# Comprimir
Compress-Archive -Path "$codeBackup\*" -DestinationPath $codeZip -Force

# Limpiar carpeta temporal
Remove-Item -Path $codeBackup -Recurse -Force

Write-Host "✅ Código comprimido en: $codeZip" -ForegroundColor Green

# 3. Backup de variables de entorno
Write-Host "`n3️⃣  Respaldando configuración..." -ForegroundColor Yellow
if (Test-Path "$proyectoDir\.env.local") {
    Copy-Item "$proyectoDir\.env.local" "$backupDir\env_$fecha.txt"
    Write-Host "✅ .env.local guardado" -ForegroundColor Green
}

# 4. Listar archivos en el backup
Write-Host "`n📋 ARCHIVOS RESPALDADOS:" -ForegroundColor Cyan
Get-ChildItem $backupDir | Where-Object { $_.Name -like "*$fecha*" } | ForEach-Object {
    Write-Host "   📄 $($_.Name) - $([math]::Round($_.Length/1MB,2)) MB"
}

Write-Host "`n🎉 BACKUP COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "📁 Ubicación: $backupDir" -ForegroundColor Yellow