// Carga las variables de entorno
import { loadEnv } from "./utils/utilis.js";

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
    console.log(`⚙️  API: http://localhost:${port}/api`);
  });
}
// Exportar para usar en otros archivos
export default app;