#!/bin/bash
# Script de despliegue a producción - UPTAMCA Sistema

set -e  # Detener en cualquier error

echo "🚀 Iniciando despliegue a producción UPTAMCA v$(git describe --tags)"

# 1. Verificar que estamos en main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Debes estar en la rama main para desplegar a producción"
    exit 1
fi

# 2. Obtener última versión
VERSION=$(git describe --tags --abbrev=0)
echo "📦 Versión a desplegar: $VERSION"

# 3. Pull últimos cambios
echo "📥 Actualizando código..."
git pull origin main

# 4. Instalar dependencias del backend
echo "🔧 Instalando dependencias backend..."
cd src/server
npm ci --only=production

# 5. Instalar dependencias del frontend
echo "🎨 Instalando dependencias frontend..."
cd ../client
npm ci --only=production
npm run build

# 6. Ejecutar pruebas (opcional en producción)
echo "🧪 Ejecutando pruebas..."
cd ../server
npm test

# 7. Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl restart uptamca-backend
sudo systemctl restart nginx

# 8. Verificar despliegue
echo "✅ Despliegue completado"
echo "🌐 Frontend: https://sistema.uptamca.edu.ve"
echo "🔗 API: https://sistema.uptamca.edu.ve/api"
echo "📊 Health check: https://sistema.uptamca.edu.ve/api/health"