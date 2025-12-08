// Importación de dependencias
import cookieParser from "cookie-parser";
import express from "express";
import { securityMiddleware } from "./middlewares/security.js";
import { dynamicRateLimiter } from "./middlewares/rate-limiting.js";
import { jsonSyntaxErrorHandler } from "./middlewares/process.js";
import helmet from "helmet";
import { createServer } from "node:http";
import config from "./config/index.js"; // Importar configuración

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

// Obtener configuraciones
const serverConfig = config.server;
const securityConfigData = config.security;
const socketConfig = serverConfig.socket;

// Después de las configuraciones, ANTES de las rutas, agrega:
if (securityConfigData.rateLimit.enabled) {
  console.log("🛡️  Rate limiting habilitado");
  app.use(dynamicRateLimiter);
} else {
  console.log("⚠️  Rate limiting deshabilitado por configuración");
}

// Middlewares de seguridad configurados
app.use(securityMiddleware);

// Body parsers configurados
app.use(
  express.json({
    limit: securityConfigData.misc.compression ? "10mb" : "1mb",
    strict: true,
  })
);

app.use(cookieParser(config.auth.cookies.secret || "default-cookie-secret"));

app.use(jsonSyntaxErrorHandler);

// Middleware de compresión si está habilitado
if (securityConfigData.misc.compression) {
  import("compression").then(({ default: compression }) => {
    app.use(
      compression({
        level: securityConfigData.misc.compressionLevel,
        threshold: securityConfigData.misc.compressionThreshold,
      })
    );
  });
}

// Middleware para timeouts
app.use((req, res, next) => {
  req.setTimeout(securityConfigData.misc.requestTimeout);
  res.setTimeout(securityConfigData.misc.keepAliveTimeout);
  next();
});

// ✅ RUTAS DE API - CON PREFIJO CONFIGURABLE
const apiPrefix = serverConfig.server.apiPrefix || "";
app.use(apiPrefix, adminRouter);
app.use(apiPrefix, profesorRouter);
app.use(apiPrefix, CurricularRouter);
app.use(apiPrefix, UserRouter);
app.use(apiPrefix, HorarioRouter);
app.use(apiPrefix, SedesRouter);
app.use(apiPrefix, AulaRouter);
app.use(apiPrefix, coordinadorRouter);
app.use(apiPrefix, NotificationRouter);
app.use(apiPrefix, SystemRouter);

// ✅ SERVICIOS DE SOCKET CONFIGURADOS
export function initializeSocketServices() {
  console.log("🔧 Inicializando servicios de Socket...");

  const servicioSocket = new SocketServices();

  // Configurar opciones de Socket.io desde la configuración
  const socketOptions = {
    cors: socketConfig.options.cors,
    transports: socketConfig.options.transports,
    allowEIO3: socketConfig.options.allowEIO3,
    pingTimeout: socketConfig.options.pingTimeout,
    pingInterval: socketConfig.options.pingInterval,
    connectTimeout: socketConfig.options.connectTimeout,
    allowUpgrades: socketConfig.options.allowUpgrades,
    perMessageDeflate: socketConfig.options.perMessageDeflate,
    httpCompression: socketConfig.options.httpCompression,
    maxHttpBufferSize: socketConfig.limits.maxHttpBufferSize,
    maxConnections: socketConfig.limits.maxConnections,
    maxPayload: socketConfig.limits.maxPayload,
  };

  const io = servicioSocket.initializeService(socketOptions);

  const notificationService = new NotificationService(io);

  let monitoringInterval = null;
  let superAdminCount = 0;

  // Middleware de autenticación con timeout configurable
  io.use(async (socket, next) => {
    const authTimeout = setTimeout(() => {
      next(new Error("Authentication timeout"));
    }, socketConfig.auth.timeout);

    try {
      const { user_id, roles } = socket.handshake.auth;

      if (!user_id && socketConfig.auth.required) {
        console.log("❌ Conexión rechazada: Sin user_id");
        clearTimeout(authTimeout);
        return next(new Error("Authentication error: No user_id"));
      }

      socket.user = {
        id: user_id,
        roles: roles || [],
      };

      console.log(`✅ Usuario autenticado: ${socket.user.id}`);
      clearTimeout(authTimeout);
      next();
    } catch (error) {
      console.error("❌ Error en autenticación:", error);
      clearTimeout(authTimeout);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    if (!socketConfig.enabled) return socket.disconnect();

    console.log("🟢 Nuevo cliente conectado:", socket.user.id);

    // Unirse a sala personal con prefijo configurable
    const userRoom = `${socketConfig.rooms.userPrefix}${socket.user.id}`;
    socket.join(userRoom);

    // Unirse a salas de roles con prefijo configurable
    if (socket.user.roles && socket.user.roles.length > 0) {
      socket.user.roles.forEach((role) => {
        socket.join(`${socketConfig.rooms.rolePrefix}${role}`);
      });
    }

    // Manejar SuperAdmin con sala configurable
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
      socket.join(`${socketConfig.rooms.userPrefix}${socket.user.id}`);
    });

    socket.on("join_role_room", (role) => {
      socket.join(`${socketConfig.rooms.rolePrefix}${role}`);
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

// ✅ FUNCIÓN PARA INICIAR EL SERVIDOR CONFIGURADO
export function startServerBackend(port) {
  const host = serverConfig.server.host;
  const isProduction = serverConfig.server.isProduction;

  console.log(`🚀 Iniciando servidor en ${host}:${port}...`);
  console.log(`📊 Entorno: ${serverConfig.server.environment}`);
  console.log(
    `🏷️  Aplicación: ${serverConfig.server.appName} v${serverConfig.server.appVersion}`
  );

  // Inicializar sockets si está habilitado
  if (socketConfig.enabled) {
    initializeSocketServices();
    console.log("📡 WebSockets habilitados");
  } else {
    console.log("⚠️  WebSockets deshabilitados por configuración");
  }

  // Backup automático si está configurado
  const system = new SystemServices();

  // Verificar si hay configuración de backup en las configuraciones
  if (config.services?.system?.backup?.enabled) {
    const backupInterval = config.services.system.backup.interval || 86400000;
    setInterval(() => {
      console.log("🔧 Creando respaldo automático...");
      system
        .crearRespaldo()
        .then(() => console.log("✅ Respaldo creado exitosamente"))
        .catch((err) => console.error("❌ Error en respaldo:", err));
    }, backupInterval);
    console.log(
      `🔄 Backup automático configurado cada ${backupInterval / 3600000} horas`
    );
  }

  // Iniciar servidor con configuración
  server.listen(port, host, () => {
    console.log("----------------------------------------");
    const protocol = serverConfig.server.protocol;
    const baseUrl =
      serverConfig.server.baseUrl || `${protocol}://${host}:${port}`;

    console.log(`✅ Servidor corriendo en: ${baseUrl}`);

    if (socketConfig.enabled) {
      const wsProtocol = protocol === "https" ? "wss" : "ws";
      console.log(
        `📡 WebSockets disponibles en: ${wsProtocol}://${host}:${port}`
      );
    }

    console.log(`⚙️  API Base: ${baseUrl}${apiPrefix}`);
    console.log(`🔒 Modo seguro: ${isProduction ? "Activado" : "Desactivado"}`);

    // Mostrar configuraciones importantes
    if (!isProduction) {
      console.log("📋 Configuraciones cargadas:");
      console.log(
        `   - CORS: ${securityConfigData.cors.allowedOrigins.length} orígenes permitidos`
      );
      console.log(
        `   - Rate Limit: ${securityConfigData.rateLimit.global.max} req/${
          securityConfigData.rateLimit.global.windowMs / 60000
        }min`
      );
      console.log(
        `   - Socket: ${socketConfig.enabled ? "Habilitado" : "Deshabilitado"}`
      );
      console.log(
        `   - Socket Conexiones máx: ${socketConfig.limits.maxConnections}`
      );
    }
  });

  // Manejo de errores del servidor
  server.on("error", (error) => {
    console.error("❌ Error del servidor:", error);
    if (error.code === "EADDRINUSE") {
      console.error(`El puerto ${port} está en uso. Intenta con otro puerto.`);
      process.exit(1);
    }
  });

  // Manejo de señales de terminación
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  function gracefulShutdown() {
    console.log("🛑 Recibida señal de terminación, cerrando servidor...");
    server.close(() => {
      console.log("✅ Servidor cerrado exitosamente");
      process.exit(0);
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.error("❌ Forzando cierre del servidor");
      process.exit(1);
    }, 10000);
  }
}

// Exportar para usar en otros archivos
export default app;
