// Carga las variables de entorno
import dotenv from "dotenv";

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });

// Importación de dependencias
import cookieParser from "cookie-parser";
import express from "express";
import { securityMiddleware } from "./middlewares/security.js";
import { jsonSyntaxErrorHandler } from "./middlewares/process.js";
import languageMiddleware from "./middlewares/language.js";
import { i18nMiddleware } from "./locales/index.js";
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

// ✅ CREAR app y server SIN inicializar sockets inmediatamente
const app = express();
export const server = createServer(app);

// Configuración básica de Express (esto es seguro)
app.use(securityMiddleware);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(jsonSyntaxErrorHandler);
app.use(i18nMiddleware);
app.use(languageMiddleware);

// Rutas del sistema
app.use("", adminRouter);
app.use("", profesorRouter);
app.use("", CurricularRouter);
app.use("", UserRouter);
app.use("", HorarioRouter);
app.use("", AulaRouter);
app.use("", SedesRouter);
app.use("", coordinadorRouter);
app.use("", NotificationRouter);
app.use("", SystemRouter);

// ✅ MOVER la inicialización de sockets a una función
export function initializeSocketServices() {
  console.log("🔧 Inicializando servicios de Socket...");

  const servicioSocket = new SocketServices();
  const io = servicioSocket.initializeService();

  const notificationService = new NotificationService(io);

  let monitoringInterval = null;
  let superAdminCount = 0;

  io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado:", socket.user.id);

    if (socket.user && socket.user.roles.includes("SuperAdmin")) {
      superAdminCount++;
      console.log(`SuperAdmin conectado. Total: ${superAdminCount}`);

      // 🔥 Iniciar monitoreo SOLO si es el primer SuperAdmin
      if (superAdminCount === 1 && !monitoringInterval) {
        console.log("🚀 Iniciando monitoreo del sistema...");
        monitoringInterval = SystemMonitor.iniciarMonitoreoTiempoReal(5000);
      }

      // Unir al socket a la sala de SuperAdmin
      socket.join("role_SuperAdmin");
    }

    socket.on("mark_notification_read", (noti) => {
      console.log("Evento recibido: mark_notification_read", noti);
      console.log(
        `Marcando notificación ${noti.notificationId} como leída por usuario ${socket.user.id}`
      );
      notificationService.markAsRead(noti.notificationId, socket.user.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Cliente desconectado:", socket.id, "Razón:", reason);

      if (socket.user && socket.user.roles.includes("SuperAdmin")) {
        superAdminCount--;
        console.log(`SuperAdmin desconectado. Total: ${superAdminCount}`);

        // 🔥 Detener monitoreo si no hay más SuperAdmins conectados
        if (superAdminCount === 0 && monitoringInterval) {
          console.log("⏹️ Deteniendo monitoreo del sistema...");
          clearInterval(monitoringInterval);
          monitoringInterval = null;
        }
      }
    });
  });

  return { io, servicioSocket };
}

// ✅ SOLO ejecutar si es el archivo principal (para ES6 modules)
export function startServer(port = process.env.SERVER_PORT) {
  console.log(`🚀 Iniciando servidor en puerto ${port}...`);
  // Inicializar servicios de socket
  const system = new SystemServices();

  setTimeout(() => {
    console.log("🔧 Creando respaldo del sistema...");
    system.crearRespaldo().then((res) => {
      console.log("🔧 Respaldo creado:", res);
    }).catch((err) => {
      console.error("❌ Error creando respaldo:", err);
    });
  }, 86400000); //24 horas en milisegundos

  // Inicializar sockets
  initializeSocketServices();

  // Iniciar servidor
  server.listen(port, () => {
    console.log(`✅ Servidor corriendo en el puerto ${port}`);
    console.log(`📡 Notificaciones WebSocket configuradas en puerto ${port}`);
  });
}

// Exportar para usar en otros archivos (como tests)
export default app;
