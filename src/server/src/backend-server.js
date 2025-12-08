// server.js - VERSIÓN ORGANIZADA Y PROFESIONAL
import cookieParser from "cookie-parser";
import express from "express";
import { createServer } from "node:http";
import csrf from "csurf";
import config from "./config/index.js";

// Middlewares
import { securityMiddleware } from "./middlewares/security.js";
import { dynamicRateLimiter } from "./middlewares/rate-limiting.js";
import { jsonSyntaxErrorHandler } from "./middlewares/process.js";

// Servicios
import SocketServices from "./services/socket.service.js";
import SystemMonitor from "./services/systemMonitor.service.js";
import SystemServices from "./services/system.service.js";
import NotificationService from "./services/notification.service.js";

// Rutas
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

// =============================================
// 1. INICIALIZACIÓN
// =============================================
const app = express();
export const server = createServer(app);

// Configuraciones
const serverConfig = config.server;
const securityConfig = config.security;
const socketConfig = serverConfig.socket;
const apiPrefix = serverConfig.server.apiPrefix || "";

console.log("🚀 Inicializando servidor...");
console.log(`📊 Entorno: ${serverConfig.server.environment}`);
console.log(`🔗 Prefijo API: ${apiPrefix}`);

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Middleware para agregar token a todas las respuestas
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // Debe ser false para que React pueda leerlo
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  next();
});



// =============================================
// 2. MIDDLEWARES - ORDEN CRÍTICO
// =============================================

// 🔴 MIDDLEWARE CORS DE EMERGENCIA (PRIMERO SIEMPRE)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = "http://localhost:3001";

  // Solo aplicar CORS si el origen es el esperado
  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');
  }

  // Interceptar respuestas para asegurar headers
  const originalEnd = res.end;
  res.end = function (...args) {
    if (origin === allowedOrigin && !this.getHeader('Access-Control-Allow-Origin')) {
      this.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      this.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    return originalEnd.apply(this, args);
  };

  // Manejar OPTIONS inmediatamente
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// 📊 Logging de todas las peticiones (opcional para debug)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// 🛡️ Rate Limiting (si está habilitado)
app.use(dynamicRateLimiter);
console.log("🛡️  Rate limiting habilitado");

// 🔒 Middleware de seguridad (CORS ya manejado arriba, este es para otros headers)
app.use(securityMiddleware);

// 📦 Body parsers
app.use(express.json({ limit: securityConfig.misc?.bodySizeLimit || '1mb' }));

app.use(cookieParser());

// ⚠️ Error handler para JSON
app.use(jsonSyntaxErrorHandler);

// ⏱️ Timeouts
app.use((req, res, next) => {
  req.setTimeout(securityConfig.misc?.requestTimeout || 30000);
  res.setTimeout(securityConfig.misc?.keepAliveTimeout || 5000);
  next();
});

// =============================================
// 3. RUTAS DE LA API
// =============================================

// RUTA DE PRUEBA (para verificar CORS)
app.get(`${apiPrefix}/health`, (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString(),
    environment: serverConfig.server.environment,
    cors: {
      allowedOrigin: 'http://localhost:5173',
      working: true
    }
  });
});

// RUTA DE PRUEBA CON AUTENTICACIÓN
app.get(`${apiPrefix}/test-auth`,
  // Middleware de auth simulado
  (req, res, next) => {
    console.log('🔐 Middleware de auth de prueba');
    // Simular token en cookie
    const token = req.cookies?.access_token;

    if (!token) {
      // Importante: los headers CORS ya están aplicados por el primer middleware
      return res.status(401).json({
        success: false,
        error: "Token requerido"
      });
    }

    // Simular usuario autenticado
    req.user = {
      id: 'test-user-123',
      email: 'test@example.com',
      roles: ['SuperAdmin']
    };

    next();
  },
  (req, res) => {
    res.json({
      success: true,
      message: 'Autenticación funcionando',
      user: req.user
    });
  }
);

// REGISTRAR TODAS LAS RUTAS
const routers = [
  { path: '/admin', router: adminRouter },
  { path: '/profesor', router: profesorRouter },
  { path: '/curricular', router: CurricularRouter },
  { path: '/user', router: UserRouter },
  { path: '/horario', router: HorarioRouter },
  { path: '/sedes', router: SedesRouter },
  { path: '/aula', router: AulaRouter },
  { path: '/coordinador', router: coordinadorRouter },
  { path: '/notification', router: NotificationRouter },
  { path: '/system', router: SystemRouter },
];

routers.forEach(({ path, router }) => {
  app.use(`${apiPrefix}`, router);
  console.log(`✅ Ruta registrada: ${apiPrefix}${path}`);
});

// =============================================
// 4. MANEJO DE ERRORES Y RUTAS NO ENCONTRADAS
// =============================================

// 404 - Ruta no encontrada
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "La ruta solicitada no existe",
      path: req.path,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('🔥 Error del servidor:', err);

  // Asegurar headers CORS en errores
  const origin = req.headers.origin;
  if (origin === 'http://localhost:5173') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: "Ocurrió un error en el servidor",
      ...(isDevelopment && { details: err.message, stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
});

// =============================================
// 5. CONFIGURACIÓN DE SOCKETS
// =============================================
export function initializeSocketServices() {
  if (!socketConfig.enabled) {
    console.log("⚠️  WebSockets deshabilitados por configuración");
    return null;
  }

  console.log("🔧 Inicializando servicios de Socket...");

  const servicioSocket = new SocketServices();
  const socketOptions = {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    },
    transports: socketConfig.options.transports,
    pingTimeout: socketConfig.options.pingTimeout,
    pingInterval: socketConfig.options.pingInterval,
    maxHttpBufferSize: socketConfig.limits.maxHttpBufferSize,
  };

  const io = servicioSocket.initializeService(socketOptions);
  const notificationService = new NotificationService(io);

  // Autenticación de sockets
  io.use(async (socket, next) => {
    try {
      const { user_id, roles } = socket.handshake.auth;

      if (!user_id && socketConfig.auth.required) {
        return next(new Error("Authentication error: No user_id"));
      }

      socket.user = {
        id: user_id,
        roles: roles || [],
      };

      console.log(`✅ Socket autenticado: ${socket.user.id}`);
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Nuevo cliente conectado:", socket.user?.id || 'anonymous');

    if (socket.user) {
      // Unir a salas
      socket.join(`user_${socket.user.id}`);
      socket.user.roles?.forEach(role => {
        socket.join(`role_${role}`);
      });
    }

    // Eventos del cliente
    socket.on("mark_notification_read", (noti) => {
      if (socket.user) {
        notificationService.markAsRead(noti.notificationId, socket.user.id);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Cliente desconectado:", socket.user?.id || 'anonymous');
    });
  });

  console.log("✅ Servicios de Socket inicializados");
  return { io, servicioSocket };
}

// =============================================
// 6. INICIALIZACIÓN DEL SERVIDOR
// =============================================
export function startServerBackend(port = 3000) {
  const host = serverConfig.server.host || 'localhost';
  const isProduction = serverConfig.server.isProduction;

  // Inicializar sockets si están habilitados
  if (socketConfig.enabled) {
    initializeSocketServices();
    console.log("📡 WebSockets habilitados");
  }

  // Backup automático (si está configurado)
  if (config.services?.system?.backup?.enabled) {
    const system = new SystemServices();
    const backupInterval = config.services.system.backup.interval || 86400000;

    setInterval(() => {
      console.log("🔧 Creando respaldo automático...");
      system.crearRespaldo()
        .then(() => console.log("✅ Respaldo creado exitosamente"))
        .catch(console.error);
    }, backupInterval);

    console.log(`🔄 Backup automático configurado cada ${backupInterval / 3600000} horas`);
  }

  // Monitoreo del sistema para SuperAdmin
  if (serverConfig.server.environment === 'development') {
    SystemMonitor.iniciarMonitoreoTiempoReal(10000);
  }

  // Iniciar servidor
  server.listen(port, host, () => {
    console.log("\n" + "=".repeat(50));
    console.log(`✅ Servidor corriendo en: http://${host}:${port}`);
    console.log(`📚 Documentación API: http://${host}:${port}${apiPrefix}/health`);
    console.log(`🌐 Origen permitido: http://localhost:5173`);
    console.log(`⚙️  Modo: ${isProduction ? 'Producción 🔒' : 'Desarrollo 🚧'}`);

    if (socketConfig.enabled) {
      const wsProtocol = serverConfig.server.protocol === 'https' ? 'wss' : 'ws';
      console.log(`📡 WebSockets: ${wsProtocol}://${host}:${port}`);
    }

    console.log("=".repeat(50) + "\n");
  });

  // Manejo de errores del servidor
  server.on('error', (error) => {
    console.error('❌ Error del servidor:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`El puerto ${port} está en uso. Intenta con otro puerto.`);
      process.exit(1);
    }
  });

  // Manejo de señales de terminación
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  function gracefulShutdown() {
    console.log('\n🛑 Recibida señal de terminación...');
    server.close(() => {
      console.log('✅ Servidor cerrado exitosamente');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('❌ Forzando cierre del servidor');
      process.exit(1);
    }, 10000);
  }
}

// =============================================
// 7. EXPORTACIONES
// =============================================
export default app;

// Para ejecución directa
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3000;
  startServerBackend(port);
}