// middlewares/security.middleware.js
import cors from "cors";
import helmet from "helmet";
import config from "../config/index.js";

// Crear middleware de CORS una sola vez (más eficiente)
const corsConfig = config.security?.cors || {};
const envConfig = config.security?.environment || {};
const isDevelopment =
  envConfig.isDevelopment || envConfig.mode === "development";

// Configuración de CORS optimizada
const corsOptions = {
  origin: "http://localhost:3001", // Permitir solo el origen específico
  credentials: true,
  methods: corsConfig.allowedMethods || [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ],
  allowedHeaders: corsConfig.allowedHeaders || [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-CSRF-Token",
  ],
  exposedHeaders: corsConfig.exposedHeaders || [
    "Authorization",
    "X-CSRF-Token",
  ],
  optionsSuccessStatus: 200, // Usar 200 en lugar de 204
  maxAge: corsConfig.maxAge || 86400,
  preflightContinue: false, // Importante: false para que Express maneje preflight
};

// Configuración de Helmet optimizada
const helmetConfig = {
  contentSecurityPolicy: config.security?.helmet?.contentSecurityPolicy,
  hsts: config.security?.helmet?.hsts,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: config.security?.helmet?.dnsPrefetchControl,
  frameguard: config.security?.helmet?.frameguard,
  hidePoweredBy: config.security?.helmet?.hidePoweredBy,
  ieNoOpen: config.security?.helmet?.ieNoOpen,
  noSniff: config.security?.helmet?.noSniff,
  permittedCrossDomainPolicies:
    config.security?.helmet?.permittedCrossDomainPolicies,
  referrerPolicy: config.security?.helmet?.referrerPolicy,
  xssFilter: config.security?.helmet?.xssFilter,
};

// Middleware de CORS como función independiente
export const corsMiddleware = cors(corsOptions);

// Middleware de Helmet como función independiente
export const helmetMiddleware = helmet(helmetConfig);

/**
 * @function securityMiddleware
 * @description Middleware de seguridad unificado (versión simplificada)
 */
export function securityMiddleware(req, res, next) {
  // 1. Aplicar CORS primero
  corsMiddleware(req, res, (err) => {
    if (err) {
      // Manejo de error CORS mejorado
      return handleCorsError(err, req, res);
    }

    // 2. Aplicar Helmet
    helmetMiddleware(req, res, () => {
      // 3. Aplicar headers personalizados
      applySecurityHeaders(req, res);

      // 4. Log si está habilitado
      if (config.security?.logging?.securityEvents?.enabled) {
        logSecurityEvent(req);
      }

      // 5. Continuar
      next();
    });
  });
}

/**
 * Maneja errores CORS
 */
function handleCorsError(error, req, res) {
  console.error(`❌ CORS Error: ${error.message} - ${req.method} ${req.path}`);

  const errorResponse = {
    success: false,
    error: {
      code: "CORS_POLICY_VIOLATION",
      message: "Acceso denegado por política CORS",
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  // Agregar debug info en desarrollo
  if (isDevelopment && corsConfig.developmentBehavior?.showDebugInfo) {
    errorResponse.debug = {
      origin: req.headers.origin,
      allowedOrigins: corsConfig.allowedOrigins,
      requestedHeaders: req.headers,
    };
  }

  return res.status(403).json(errorResponse);
}

/**
 * Aplica headers de seguridad personalizados
 */
function applySecurityHeaders(req, res) {
  const miscConfig = config.security?.misc || {};

  // Eliminar headers sensibles
  res.removeHeader("X-Powered-By");

  if (miscConfig.hideServerInfo !== false) {
    res.removeHeader("Server");
  }

  // Headers básicos (si no los puso Helmet)
  if (!res.getHeader("X-Content-Type-Options")) {
    res.setHeader("X-Content-Type-Options", "nosniff");
  }

  if (!res.getHeader("X-Frame-Options")) {
    res.setHeader("X-Frame-Options", "DENY");
  }

  // Cache control
  if (miscConfig.cacheControl && !res.getHeader("Cache-Control")) {
    res.setHeader("Cache-Control", miscConfig.cacheControl);
  }

  // Server name personalizado
  if (miscConfig.serverName) {
    res.setHeader("X-Server-Name", miscConfig.serverName);
  }

  // Headers adicionales
  if (!res.getHeader("Permissions-Policy")) {
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );
  }
}

/**
 * Registra eventos de seguridad
 */
function logSecurityEvent(req) {
  const event = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    origin: req.headers.origin || "none",
    userAgent: req.headers["user-agent"] || "unknown",
    ip: req.ip || req.connection.remoteAddress,
  };

  console.log(
    `🔒 [Security] ${event.method} ${event.path} - Origin: ${event.origin}`
  );
}

// Exportar funciones auxiliares si se necesitan
export { applySecurityHeaders, handleCorsError };
