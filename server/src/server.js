// Carga las variables de entorno
import dotenv from "dotenv";

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });

// Importación de dependencias
import cookieParser from "cookie-parser";
import express from "express";
import { securityMiddleware } from "./middlewares/security.js";
import { jsonSyntaxErrorHandler } from "./middlewares/process.js";
<<<<<<< HEAD
import {i18nMiddleware} from "./locales/index.js";
=======
import languageMiddleware from "./middlewares/language.js";
import { i18nMiddleware } from "./locales/index.js";
>>>>>>> 1695a4f97cdf92f3f1444d009b501b24b6a4f361
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

// ✅ VERSIÓN CORREGIDA - Socket Services con autenticación
export function initializeSocketServices() {
  console.log("🔧 Inicializando servicios de Socket...");

  const servicioSocket = new SocketServices();
  const io = servicioSocket.initializeService();

  const notificationService = new NotificationService(io);

  let monitoringInterval = null;
  let superAdminCount = 0;

  // ✅ MIDDLEWARE DE AUTENTICACIÓN (ESENCIAL)
  io.use(async (socket, next) => {
    try {
      console.log("🔐 Intentando autenticar socket...", socket.handshake.auth);

      const { user_id, roles } = socket.handshake.auth;

      if (!user_id) {
        console.log("❌ Conexión rechazada: Sin user_id");
        return next(new Error("Authentication error: No user_id"));
      }

      // ✅ ASIGNAR USUARIO AL SOCKET (CRÍTICO)
      socket.user = {
        id: user_id,
        roles: roles || [],
      };

      console.log(
        `✅ Usuario autenticado: ${socket.user.id}`,
        socket.user.roles
      );
      next();
    } catch (error) {
      console.error("❌ Error en autenticación:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      "🟢 Nuevo cliente conectado:",
      socket.user.id,
      "Socket:",
      socket.id
    );

    // ✅ UNIRSE AUTOMÁTICAMENTE A SALA PERSONAL (IMPORTANTE)
    const userRoom = `user_${socket.user.id}`;
    socket.join(userRoom);
    console.log(
      `🎯 Usuario ${socket.user.id} unido a sala personal: ${userRoom}`
    );

    // ✅ UNIRSE A SALAS DE ROLES
    if (socket.user.roles && socket.user.roles.length > 0) {
      socket.user.roles.forEach((role) => {
        const roleRoom = `role_${role}`;
        socket.join(roleRoom);
        console.log(
          `👥 Usuario ${socket.user.id} unido a sala de rol: ${roleRoom}`
        );
      });
    }

    // ✅ MANEJAR SUPERADMIN
    if (socket.user.roles.includes("SuperAdmin")) {
      superAdminCount++;
      console.log(`👑 SuperAdmin conectado. Total: ${superAdminCount}`);

      if (superAdminCount === 1 && !monitoringInterval) {
        console.log("🚀 Iniciando monitoreo del sistema...");
        monitoringInterval = SystemMonitor.iniciarMonitoreoTiempoReal(5000);
      }

      socket.join("role_SuperAdmin");
    }

    // ✅ EVENTO PARA CONFIRMAR UNIÓN A SALAS (del frontend)
    socket.on("join_user_room", (data) => {
      console.log(
        `🎯 Usuario ${socket.user.id} confirmando unión a salas:`,
        data
      );
      // Ya está unido automáticamente, pero podemos verificar/re-unir
      socket.join(`user_${socket.user.id}`);
    });

    // ✅ EVENTO PARA UNIRSE A SALAS DE ROL ADICIONALES
    socket.on("join_role_room", (role) => {
      const roleRoom = `role_${role}`;
      socket.join(roleRoom);
      console.log(
        `👥 Usuario ${socket.user.id} unido a sala adicional: ${roleRoom}`
      );
    });

    // ✅ EVENTO PARA NOTIFICACIONES
    socket.on("mark_notification_read", (noti) => {
      console.log("📖 Evento recibido: mark_notification_read", noti);
      console.log(
        `Marcando notificación ${noti.notificationId} como leída por usuario ${socket.user.id}`
      );
      notificationService.markAsRead(noti.notificationId, socket.user.id);
    });

    // ✅ DEBUG: Evento para verificar salas
    socket.on("debug_rooms", () => {
      const rooms = Array.from(socket.rooms);
      console.log(`🔍 Usuario ${socket.user.id} está en salas:`, rooms);
    });

    // ✅ MANEJAR DESCONEXIÓN
    socket.on("disconnect", (reason) => {
      console.log("🔌 Cliente desconectado:", socket.user.id, "Razón:", reason);

      if (socket.user.roles.includes("SuperAdmin")) {
        superAdminCount--;
        console.log(`👑 SuperAdmin desconectado. Total: ${superAdminCount}`);

        if (superAdminCount === 0 && monitoringInterval) {
          console.log("⏹️ Deteniendo monitoreo del sistema...");
          clearInterval(monitoringInterval);
          monitoringInterval = null;
        }
      }
    });

    // ✅ MANEJAR ERRORES
    socket.on("error", (error) => {
      console.error("💥 Error en socket:", socket.user.id, error);
    });
  });

  console.log("✅ Servicios de Socket inicializados correctamente");
  return { io, servicioSocket };
}

// ✅ SOLO ejecutar si es el archivo principal (para ES6 modules)
export function startServer(port = process.env.SERVER_PORT) {
  console.log(`🚀 Iniciando servidor en puerto ${port}...`);
  // Inicializar servicios de socket
  const system = new SystemServices();

  setTimeout(() => {
    console.log("🔧 Creando respaldo del sistema...");
    system
      .crearRespaldo()
      .then((res) => {
        console.log("🔧 Respaldo creado:", res);
      })
      .catch((err) => {
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
