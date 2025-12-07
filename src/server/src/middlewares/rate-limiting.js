import rateLimit from "express-rate-limit";
import config from "../config/index.js";

export function createRateLimiter(configType = "global") {
  const rateLimitConfig = config.security.rateLimit;

  let limiterConfig;

  switch (configType) {
    case "login":
      limiterConfig = rateLimitConfig.routes.login;
      break;
    case "register":
      limiterConfig = rateLimitConfig.routes.register;
      break;
    case "passwordReset":
      limiterConfig = rateLimitConfig.routes.passwordReset;
      break;
    case "api":
      limiterConfig = rateLimitConfig.routes.api;
      break;
    case "upload":
      limiterConfig = rateLimitConfig.routes.upload;
      break;
    default:
      limiterConfig = rateLimitConfig.global;
  }

  // Crear el rate limiter
  return rateLimit({
    windowMs: limiterConfig.windowMs,
    max: limiterConfig.max,
    message: {
      error: "Rate limit exceeded",
      message: limiterConfig.message || rateLimitConfig.global.message,
      retryAfter: Math.ceil(limiterConfig.windowMs / 1000),
    },
    standardHeaders: limiterConfig.standardHeaders !== false,
    legacyHeaders: limiterConfig.legacyHeaders !== false,
    skipSuccessfulRequests: limiterConfig.skipSuccessfulRequests === true,

    // Handler cuando se excede el límite
    handler: (req, res, next, options) => {
      res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: options.message.message,
        retryAfter: options.retryAfter,
        timestamp: new Date().toISOString(),
      });
    },

    // Saltar ciertas IPs (whitelist)
    skip: (req, res) => {
      const clientIp = req.ip || req.connection.remoteAddress;
      return rateLimitConfig.whitelist.includes(clientIp);
    },

    // Skip en base a ciertas condiciones
    skip: (req, res) => {
      // Saltar en entorno de desarrollo si está configurado
      if (
        config.security.rateLimit.skipInDevelopment
      ) {
        return true;
      }

      // Saltar requests de health check
      if (req.path === "/health" || req.path === "/status") {
        return true;
      }

      return false;
    },
  });
}

// Rate limiters pre-configurados
export const globalLimiter = createRateLimiter("global");
export const loginLimiter = createRateLimiter("login");
export const registerLimiter = createRateLimiter("register");
export const passwordResetLimiter = createRateLimiter("passwordReset");
export const apiLimiter = createRateLimiter("api");
export const uploadLimiter = createRateLimiter("upload");

// Middleware para aplicar rate limiting dinámico
export function dynamicRateLimiter(req, res, next) {
  const path = req.path;

  // Determinar qué rate limiter aplicar basado en la ruta
  if (path.includes("/auth/login")) {
    return loginLimiter(req, res, next);
  } else if (path.includes("/auth/register")) {
    return registerLimiter(req, res, next);
  } else if (path.includes("/auth/reset-password")) {
    return passwordResetLimiter(req, res, next);
  } else if (path.includes("/upload") || path.includes("/api/upload")) {
    return uploadLimiter(req, res, next);
  } else if (path.includes("/admin") || path.includes("/api/admin")) {
    return routeSpecificLimiters.admin(req, res, next);
  } else if (path.includes("/profesor") || path.includes("/api/profesor")) {
    return routeSpecificLimiters.profesor(req, res, next);
  } else if (path.startsWith("/api/")) {
    return apiLimiter(req, res, next);
  } else {
    return globalLimiter(req, res, next);
  }
}
