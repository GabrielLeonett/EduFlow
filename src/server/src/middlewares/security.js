// middlewares/security.middleware.js
import cors from "cors";
import helmet from "helmet";
import config from "../config/index.js";

/**
 * @function securityMiddleware
 * @description Middleware de seguridad unificado que aplica Helmet + CORS + headers personalizados
 *
 * @param {Object} req - Objeto de petición de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 *
 * @returns {void}
 */
export function securityMiddleware(req, res, next) {
  const securityConfig = config.security || {};
  
  // 1. CONFIGURAR HELMET (pero NO aplicarlo aún)
  const helmetConfig = {
    contentSecurityPolicy: securityConfig.helmet?.contentSecurityPolicy,
    hsts: securityConfig.helmet?.hsts,
    crossOriginEmbedderPolicy: false, // IMPORTANTE: Deshabilitar para que CORS funcione
    crossOriginOpenerPolicy: false,   // IMPORTANTE: Deshabilitar para que CORS funcione
    crossOriginResourcePolicy: false, // IMPORTANTE: Deshabilitar para que CORS funcione
    dnsPrefetchControl: securityConfig.helmet?.dnsPrefetchControl,
    frameguard: securityConfig.helmet?.frameguard,
    hidePoweredBy: securityConfig.helmet?.hidePoweredBy,
    ieNoOpen: securityConfig.helmet?.ieNoOpen,
    noSniff: securityConfig.helmet?.noSniff,
    permittedCrossDomainPolicies: securityConfig.helmet?.permittedCrossDomainPolicies,
    referrerPolicy: securityConfig.helmet?.referrerPolicy,
    xssFilter: securityConfig.helmet?.xssFilter,
  };

  // 2. PRIMERO aplicar CORS
  const corsOptions = getCorsConfig(securityConfig);
  
  cors(corsOptions)(req, res, (corsError) => {
    if (corsError) {
      return handleCorsError(corsError, req, res, securityConfig);
    }

    // 3. LUEGO aplicar Helmet
    helmet(helmetConfig)(req, res, () => {
      // 4. FINALMENTE aplicar headers personalizados
      applySecurityHeaders(req, res, securityConfig);
      applyAdditionalSecurityHeaders(req, res, securityConfig);
      logSecurityEvent(req, res, securityConfig);
      
      next();
    });
  });
}

/**
 * Genera configuración CORS dinámica basada en la configuración
 * @private
 */
function getCorsConfig(securityConfig) {
  const corsConfig = securityConfig.cors || {};
  const envConfig = securityConfig.environment || {};
  const isDevelopment = envConfig.isDevelopment || envConfig.mode === "development";

  console.log(`🔐 Configurando CORS. Orígenes permitidos: ${corsConfig.allowedOrigins?.join(", ") || "ninguno"}`);
  console.log(`   Modo desarrollo: ${isDevelopment}`);

  return {
    origin: (origin, callback) => {
      // En desarrollo con allowAllOrigins habilitado
      if (
        isDevelopment &&
        corsConfig.developmentBehavior &&
        corsConfig.developmentBehavior.allowAllOrigins
      ) {
        if (corsConfig.developmentBehavior.logBlockedOrigins) {
          console.log(
            `🟡 [DEV CORS] Permitiendo origen: ${origin || "sin origen"}`
          );
        }
        return callback(null, true);
      }

      // Permitir null origin (mobile apps, curl, etc.)
      if (
        !origin &&
        corsConfig.validation &&
        corsConfig.validation.allowNullOrigin
      ) {
        return callback(null, true);
      }

      // Validar contra lista de orígenes permitidos
      const allowedOrigins = corsConfig.allowedOrigins || [];
      
      // Permitir si el origen está en la lista
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Permitir subdominios si está configurado
      if (corsConfig.allowSubdomains && origin) {
        const isSubdomainAllowed = allowedOrigins.some(allowedOrigin => {
          try {
            const originUrl = new URL(origin);
            const allowedUrl = new URL(allowedOrigin);
            return originUrl.hostname.endsWith(`.${allowedUrl.hostname}`);
          } catch {
            return false;
          }
        });
        
        if (isSubdomainAllowed) {
          return callback(null, true);
        }
      }

      // Log para debugging
      if (
        isDevelopment &&
        corsConfig.developmentBehavior &&
        corsConfig.developmentBehavior.logBlockedOrigins
      ) {
        console.warn(`🔴 [CORS BLOQUEADO] Origen: ${origin}`);
        console.warn(`   Allowed origins: ${allowedOrigins.join(", ")}`);
      }

      callback(new Error("Origen no permitido por política CORS"), false);
    },

    credentials: corsConfig.allowCredentials !== false,
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
    preflightContinue: corsConfig.preflightContinue === true,
    optionsSuccessStatus: corsConfig.optionsSuccessStatus || 204,
    maxAge: corsConfig.maxAge || 86400,
  };
}

/**
 * Maneja errores CORS con respuestas personalizadas
 * @private
 */
function handleCorsError(error, req, res, securityConfig) {
  const envConfig = securityConfig.environment || {};
  const isDevelopment = envConfig.isDevelopment || envConfig.mode === "development";

  // Respuesta de error mejorada
  const errorResponse = {
    success: false,
    error: {
      code: "CORS_POLICY_VIOLATION",
      message: "Acceso denegado por política de seguridad",
      details: isDevelopment
        ? error.message
        : "Contacta al administrador del sistema",
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  // Información adicional en desarrollo
  if (
    isDevelopment &&
    securityConfig.cors?.developmentBehavior?.showDebugInfo
  ) {
    errorResponse.debug = {
      origin: req.headers.origin,
      allowedOrigins: securityConfig.cors.allowedOrigins,
      requestedMethod: req.method,
      requestedHeaders: req.headers,
    };
  }

  console.error(`❌ Error CORS: ${error.message} para ${req.method} ${req.path}`);
  return res.status(403).json(errorResponse);
}

/**
 * Aplica headers de seguridad básicos
 * @private
 */
function applySecurityHeaders(req, res, securityConfig) {
  const miscConfig = securityConfig.misc || {};

  // Eliminar headers sensibles
  res.removeHeader("X-Powered-By");
  if (miscConfig.hideServerInfo !== false) {
    res.removeHeader("Server");
  }

  // Headers de seguridad básicos (si no fueron ya establecidos por Helmet)
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
}

/**
 * Aplica headers de seguridad adicionales
 * @private
 */
function applyAdditionalSecurityHeaders(req, res, securityConfig) {
  const helmetConfig = securityConfig.helmet || {};

  // Referrer Policy (si no fue establecido por Helmet)
  if (helmetConfig.referrerPolicy && helmetConfig.referrerPolicy.policy && 
      !res.getHeader("Referrer-Policy")) {
    res.setHeader("Referrer-Policy", helmetConfig.referrerPolicy.policy);
  }

  // Permissions Policy (si no fue establecido por Helmet)
  if (!res.getHeader("Permissions-Policy")) {
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );
  }

  // X-XSS-Protection (para navegadores antiguos)
  if (helmetConfig.xssFilter !== false && !res.getHeader("X-XSS-Protection")) {
    res.setHeader("X-XSS-Protection", "1; mode=block");
  }

  // X-Download-Options (para IE)
  if (helmetConfig.ieNoOpen !== false && !res.getHeader("X-Download-Options")) {
    res.setHeader("X-Download-Options", "noopen");
  }

  // DNS Prefetch Control
  if (
    helmetConfig.dnsPrefetchControl &&
    helmetConfig.dnsPrefetchControl.allow === false &&
    !res.getHeader("X-DNS-Prefetch-Control")
  ) {
    res.setHeader("X-DNS-Prefetch-Control", "off");
  }
}

/**
 * Registra eventos de seguridad si está habilitado
 * @private
 */
function logSecurityEvent(req, res, securityConfig) {
  const loggingConfig = securityConfig.logging || {};

  if (loggingConfig.securityEvents && loggingConfig.securityEvents.enabled) {
    const event = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      origin: req.headers.origin || "none",
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.ip || req.connection.remoteAddress,
      status: "allowed",
    };

    console.log(
      `🔒 [Security] ${event.method} ${event.path} - Origin: ${event.origin} - IP: ${event.ip}`
    );
  }
}

/**
 * Middleware específico para APIs públicas (sin credenciales)
 */
export function apiSecurityMiddleware(req, res, next) {
  const corsOptions = {
    origin: "*", // APIs públicas permiten cualquier origen
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-API-Key"],
    maxAge: 3600,
  };

  cors(corsOptions)(req, res, (err) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: "Acceso denegado a API pública",
        message: err.message,
      });
    }

    // Headers específicos para API
    res.setHeader(
      "X-API-Version",
      config.security?.api?.defaultVersion || "v1"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    next();
  });
}

/**
 * Middleware para webhooks (configuración especial)
 */
export function webhookSecurityMiddleware(req, res, next) {
  const securityConfig = config.security || {};
  const corsConfig = {
    origin: securityConfig.cors?.allowedOrigins || [],
    credentials: false,
    methods: ["POST", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "X-Webhook-Signature",
      "X-Webhook-Timestamp",
      "User-Agent",
    ],
    maxAge: 300, // 5 minutos para webhooks
  };

  cors(corsConfig)(req, res, (err) => {
    if (err) {
      return res.status(403).json({
        error: "Acceso denegado para webhook",
        message: "Origen no autorizado",
      });
    }

    // Headers específicos para webhooks
    res.setHeader("X-Webhook-Received", "true");
    res.setHeader("X-Content-Type-Options", "nosniff");

    next();
  });
}

/**
 * Middleware para agregar Request ID a todas las peticiones
 */
export function requestIdMiddleware(req, res, next) {
  const requestId =
    req.headers["x-request-id"] ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
}

/**
 * Middleware de validación de seguridad básica
 */
export function securityValidationMiddleware(req, res, next) {
  const securityConfig = config.security || {};
  const validationConfig = securityConfig.validation || {};

  // Validar tamaño del body (si existe la configuración)
  if (validationConfig.maxBodySize) {
    const contentLength = parseInt(req.headers["content-length"]) || 0;
    if (contentLength > validationConfig.maxBodySize) {
      return res.status(413).json({
        success: false,
        error: "Payload Too Large",
        message: `El tamaño del cuerpo excede el límite de ${validationConfig.maxBodySize} bytes`,
      });
    }
  }

  // Agregar timestamp de procesamiento
  req._startTime = Date.now();

  // Interceptar respuesta para agregar headers de tiempo
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - req._startTime;
    res.setHeader("X-Processing-Time", `${duration}ms`);
    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Función para validar configuración de seguridad en startup
 */
export function validateSecurityConfig() {
  const securityConfig = config.security || {};
  const envConfig = securityConfig.environment || {};

  console.log("🔐 Validando configuración de seguridad...");

  // Validar CORS
  if (
    !securityConfig.cors?.allowedOrigins ||
    securityConfig.cors.allowedOrigins.length === 0
  ) {
    console.warn("⚠️  CORS: No hay orígenes permitidos configurados");
  } else {
    console.log(`✅ CORS: ${securityConfig.cors.allowedOrigins.length} orígenes configurados`);
  }

  // Validar entorno de producción
  if (envConfig.isProduction) {
    console.log("✅ Entorno: Producción");

    // Verificar que no se permitan todos los orígenes en producción
    if (securityConfig.cors?.developmentBehavior?.allowAllOrigins) {
      console.error(
        "❌ PELIGRO: CORS permite todos los orígenes en producción"
      );
    }

    // Verificar CSP en producción
    if (!securityConfig.helmet?.contentSecurityPolicy?.enabled) {
      console.warn(
        "⚠️  CSP: Content Security Policy deshabilitado en producción"
      );
    }
  } else {
    console.log(`✅ Entorno: ${envConfig.mode || "development"}`);
  }

  console.log("✅ Configuración de seguridad validada");
}

// Ejecutar validación al cargar el módulo (solo una vez)
validateSecurityConfig();