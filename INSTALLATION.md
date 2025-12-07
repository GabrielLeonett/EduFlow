# ⚙️ Instalación – UPTAMCA Academic Management System
Guía oficial para instalar, configurar y ejecutar el sistema académico UPTAMCA en entorno local.

## 📋 Requisitos Previos
Antes de instalar el sistema, asegúrate de tener:

### 🟦 Sistema Base

Windows 10/11, Linux o macOS
Git instalado
Editor recomendado: VS Code

### 🟩 Backend (Node.js / Express)

Node.js 18.x o superior
npm 9.x o superior
PostgreSQL 17+
Redis (opcional, si usas caché)

### 🟦 Frontend (React 18 + MUI)

Navegador moderno (Chrome, Edge, Firefox)

## 📁 Clonar el Repositorio
`git clone https://github.com/usuario/uptamca-academic-system.git`
`cd uptamca-academic-system`

## 🟩 Instalación del Backend
### 1️⃣ Ir a la carpeta del backend
`cd backend`

### 2️⃣ Instalar dependencias
`npm install`

### 3️⃣ Configurar variables de entorno
Crea un archivo:

`backend/.env`

Con variables como:

`PORT=4000`
`DATABASE_URL=postgres://usuario:password@localhost:5432/uptamca_db`
`JWT_SECRET=tu_clave_segura`
`REDIS_URL=redis://localhost:6379`

### 4️⃣ Ejecutar migraciones/seed (si aplica)
`npm run migrate`
`npm run seed`

### 5️⃣ Iniciar servidor backend
`npm run dev`

El backend estará disponible en:
👉 `http://localhost:4000`

## 🟦 Instalación del Frontend
### 1️⃣ Ir a la carpeta del frontend
`cd ../frontend`

### 2️⃣ Instalar dependencias
`npm install`

### 3️⃣ Configurar variables de entorno
Crear archivo:

`frontend/.env`

Ejemplo:

`VITE_API_URL=http://localhost:4000`

### 4️⃣ Ejecutar el frontend
`npm run dev`

El frontend estará disponible en:
👉 `http://localhost:5173`
 (o el puerto que Vite asigne)

## 🗄️ Configuración de PostgreSQL

### 1️⃣ Crear una base de datos:

`CREATE DATABASE uptamca_db;`

### 2️⃣ Crear usuario (si aplica):

`CREATE USER admin WITH PASSWORD '1234';`
`GRANT ALL PRIVILEGES ON DATABASE uptamca_db TO admin;`

### 3️⃣ Verifica la conexión desde tu .env.

## 💼 Opcional: Configurar Redis (para caché y notificaciones)
Instalar Redis (solo si tu proyecto lo usa):

### Windows (usando WSL o Docker):

`docker run --name redis -p 6379:6379 -d redis`

### Linux:

`sudo apt install redis-server`
`sudo systemctl enable redis`

### macOS:

`brew install redis`
`brew services start redis`

## 🧪 Verificación del Funcionamiento
Una vez backend y frontend estén ejecutándose:

Abre `http://localhost:5173`
Inicia sesión o crea un usuario (según tu configuración)

Comprueba:
Gestión de docentes
Creación de horarios
Gestión de PNFs
Espacios físicos
Exportación a DOCX

## ❗ Problemas Comunes
### ❓ “El backend no inicia”

Verifica versión de Node (mínimo 18)
Revisa que el puerto 4000 no esté ocupado
Confirma que tu .env tenga datos correctos

### ❓ “Frontend no muestra datos”

Backend apagado
Variable VITE_API_URL mal configurada
Bloqueo por CORS (si está mal configurado)

### ❓ “No conecta con PostgreSQL”

El servicio no está iniciado
El usuario o database no existen
Contraseña incorrecta

## 🎉 Instalación Completa
Ya tienes el sistema UPTAMCA Academic Management System funcionando en tu entorno local.