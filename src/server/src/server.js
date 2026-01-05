// Carga las variables de entorno
import { loadEnv } from "../src/utils/utilis.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv();

// Importación de dependencias
import cookieParser from "cookie-parser";
import express from "express";
import { securityMiddleware } from "./middlewares/security.js";
import { jsonSyntaxErrorHandler } from "./middlewares/process.js";
import helmet from "helmet";
import { createServer } from "node:http";

import SocketServices from "./services/socket.service.js";
import SystemMonitor from "./services/systemMonitor.service.js";
import SystemServices from "./services/system.service.js";
import NotificationService from "./services/notification.service.js";

// Importaciones de Rutas
import { adminRouter } from "./routes/Admin.routes.js";
import { profesorRouter } from "./routes/profesor.routes.js";
import { CurricularRouter } from "./routes/curricular.routes.js";
import { UserRouter } from "./routes/user.routes.js";
import { HorarioRouter } from "./routes/horario.routes.js";
import { SedesRouter } from "./routes/sedes.routes.js";
import { AulaRouter } from "./routes/aula.routes.js";
import { coordinadorRouter } from "./routes/coordinador.routes.js";
import { NotificationRouter } from "./routes/notification.routes.js";
import { SystemRouter } from "./routes/system.routes.js";

// ✅ CREAR app y server
const app = express();
export const server = createServer(app);

// Configuración básica de Express
app.use(securityMiddleware);
app.use(helmet()); // Agregar helmet para seguridad
app.use(express.json());
app.use(cookieParser());
app.use(jsonSyntaxErrorHandler);

// ✅ DETECTAR MODO (desarrollo vs producción)
const isProduction = process.env.NODE_ENV === "production";

// ✅ CONFIGURAR SERVIDOR DE ARCHIVOS ESTÁTICOS (SOLO EN PRODUCCIÓN)
if (isProduction) {
  console.log("🌐 Modo producción: Sirviendo archivos estáticos de React");
} else {
  console.log(
    "🔧 Modo desarrollo: Archivos estáticos servidos por Vite/React en puerto 3000"
  );
}

// ✅ RUTAS DE API - CON PREFIJO /api PARA MEJOR ORGANIZACIÓN
app.use("", adminRouter);
app.use("", profesorRouter);
app.use("", CurricularRouter);
app.use("", UserRouter);
app.use("", HorarioRouter);
app.use("", SedesRouter);
app.use("", AulaRouter);
app.use("", coordinadorRouter);
app.use("", NotificationRouter);
app.use("", SystemRouter);

// ✅ RUTA DE SALUD DEL SISTEMA
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    app: "Sistema UPTAMCA",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ✅ CATCH-ALL PARA REACT ROUTER (SOLO EN PRODUCCIÓN Y SI HAY BUILD)
if (isProduction) {
  // Buscar index.html en posibles ubicaciones
  const possiblePaths = [
    path.resolve(__dirname, "../../client/dist/index.html"),  // Cambié build por dist (Vite)
    path.resolve(__dirname, "../../client/build/index.html"), // Create React App
    path.resolve(__dirname, "../client/dist/index.html"),
    path.resolve(__dirname, "./client/dist/index.html"),
    path.resolve(process.cwd(), "client/dist/index.html"),
    path.resolve(process.cwd(), "dist/index.html"),
  ];

  let indexPath = null;

  // Buscar el archivo en las posibles ubicaciones
  for (const possiblePath of possiblePaths) {
    try {
      if (fs.existsSync(possiblePath)) {
        indexPath = possiblePath;
        console.log(`✅ Encontrado index.html en: ${possiblePath}`);
        break;
      }
    } catch (error) {
      console.log(`⚠️  Error al verificar: ${possiblePath}`);
    }
  }

  if (indexPath) {
    // Obtener el directorio de los archivos estáticos
    const staticDir = path.dirname(indexPath);
    
    console.log(`📁 Sirviendo archivos estáticos desde: ${staticDir}`);

    // Servir archivos estáticos de la build de React
    app.use(express.static(staticDir));

    // Catch-all route para React Router (SPA)
    app.get("/", (req, res) => {
      // Verificar si es una ruta de API
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      
      // Servir index.html para todas las demás rutas
      res.sendFile(indexPath);
    });

    console.log("✅ React Router configurado (SPA mode)");
  } else {
    console.log("⚠️  No se encontró index.html - React build no disponible");
    console.log("⚠️  Ejecuta 'npm run build' en el cliente primero");
    
    // Si no hay build, mostrar mensaje en la raíz
    app.get("/health", (req, res) => {
      res.send(`
        <html>
          <head><title>Sistema UPTAMCA</title></head>
          <body>
            <h1>Backend funcionando ✅</h1>
            <p>API disponible en <a href="/api">/api</a></p>
            <p>Health check: <a href="/api/health">/api/health</a></p>
            <p style="color: red;">⚠️ Frontend no encontrado. Ejecuta 'npm run build' en el cliente.</p>
          </body>
        </html>
      `);
    });
  }
} else {
  // En desarrollo, solo mostrar que el backend está funcionando
  app.get("/health", (req, res) => {
    res.send(`
      <html>
        <head><title>Sistema UPTAMCA - Desarrollo</title></head>
        <body>
          <h1>Backend funcionando ✅</h1>
          <p>Modo: Desarrollo</p>
          <p>API disponible en <a href="/api">/api</a></p>
          <p>Health check: <a href="/api/health">/api/health</a></p>
          <p>Frontend (Vite): <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></p>
        </body>
      </html>
    `);
  });
}

// ✅ SERVICIOS DE SOCKET
export function initializeSocketServices() {
  console.log("🔧 Inicializando servicios de Socket...");

  const servicioSocket = new SocketServices();
  const io = servicioSocket.initializeService();

  const notificationService = new NotificationService(io);

  let monitoringInterval = null;
  let superAdminCount = 0;

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const { user_id, roles } = socket.handshake.auth;

      if (!user_id) {
        console.log("❌ Conexión rechazada: Sin user_id");
        return next(new Error("Authentication error: No user_id"));
      }

      socket.user = {
        id: user_id,
        roles: roles || [],
      };

      console.log(`✅ Usuario autenticado: ${socket.user.id}`);
      next();
    } catch (error) {
      console.error("❌ Error en autenticación:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Nuevo cliente conectado:", socket.user.id);

    // Unirse a sala personal
    const userRoom = `user_${socket.user.id}`;
    socket.join(userRoom);

    // Unirse a salas de roles
    if (socket.user.roles && socket.user.roles.length > 0) {
      socket.user.roles.forEach((role) => {
        socket.join(`role_${role}`);
      });
    }

    // Manejar SuperAdmin
    if (socket.user.roles.includes("SuperAdmin")) {
      superAdminCount++;
      console.log(`👑 SuperAdmin conectado. Total: ${superAdminCount}`);

      if (superAdminCount === 1 && !monitoringInterval) {
        console.log("🚀 Iniciando monitoreo del sistema...");
        monitoringInterval = SystemMonitor.iniciarMonitoreoTiempoReal(5000);
      }
    }

    // Eventos del cliente
    socket.on("join_user_room", (data) => {
      socket.join(`user_${socket.user.id}`);
    });

    socket.on("join_role_room", (role) => {
      socket.join(`role_${role}`);
    });

    socket.on("mark_notification_read", (noti) => {
      notificationService.markAsRead(noti.notificationId, socket.user.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Cliente desconectado:", socket.user.id);

      if (socket.user.roles.includes("SuperAdmin")) {
        superAdminCount--;
        if (superAdminCount === 0 && monitoringInterval) {
          clearInterval(monitoringInterval);
          monitoringInterval = null;
        }
      }
    });
  });

  console.log("✅ Servicios de Socket inicializados");
  return { io, servicioSocket };
}

// ✅ FUNCIÓN PARA INICIAR EL SERVIDOR
export function startServer(port = process.env.SERVER_PORT || 3001) {
  console.log(`🚀 Iniciando servidor en puerto ${port}...`);

  // Inicializar sockets
  initializeSocketServices();

  // Backup automático cada 24 horas
  const system = new SystemServices();
  setInterval(() => {
    console.log("🔧 Creando respaldo automático...");
    system
      .crearRespaldo()
      .then(() => console.log("✅ Respaldo creado"))
      .catch((err) => console.error("❌ Error en respaldo:", err));
  }, 86400000); // 24 horas

  // Iniciar servidor
  server.listen(port, () => {
    console.log(`✅ Servidor corriendo en: http://localhost:${port}`);
    console.log(`📡 WebSockets disponibles`);

    if (isProduction) {
      console.log(`🌐 Frontend: http://localhost:${port}`);
    } else {
      console.log(`👨‍💻 Frontend (dev): http://localhost:3000`);
    }

    console.log(`⚙️  API: http://localhost:${port}/api`);
    console.log(`📊 Health: http://localhost:${port}/api/health`);
  });
}

// ✅ INICIAR AUTOMÁTICAMENTE SI ES EL ARCHIVO PRINCIPAL
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

// Exportar para usar en otros archivos
export default app;