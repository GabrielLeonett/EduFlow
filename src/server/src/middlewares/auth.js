// middlewares/auth.js - VERSIÓN MIGRADA Y ACTUALIZADA
import jwt from "jsonwebtoken";
import { getCookie } from "../utils/utilis.js";
import config from "../config/index.js";

/**
 * Middleware de autenticación JWT que protege rutas basado en roles.
 *
 * ✅ Ahora compatible con:
 * - Cookies HTTP-only (access_token, refresh_token)
 * - Headers Authorization (Bearer token)
 * - Configuración centralizada (config.auth)
 * - Roles jerárquicos
 *
 * @example
 * // Uso básico:
 * router.get('/ruta', middlewareAuth(['admin', 'editor']), handler);
 *
 * // Ruta opcionalmente protegida:
 * router.get('/ruta', middlewareAuth([], { required: false }), handler);
 *
 * @param {string[]} [requiredRoles] - Roles requeridos para acceder (opcional).
 * @param {Object} [options] - Opciones adicionales
 * @param {boolean} [options.required=true] - Si la autenticación es requerida
 * @param {boolean} [options.allowExpired=false] - Permitir tokens expirados (para refresh)
 * @param {string} [options.tokenSource='auto'] - 'cookie', 'header', o 'auto'
 *
 * @returns {import('express').RequestHandler} Middleware de Express
 */
export const middlewareAuth = (requiredRoles = [], options = {}) => {
  const {
    required = true,
    allowExpired = false,
    tokenSource = "cookie",
  } = options;
  return async (req, res, next) => {
    try {
      // 1. Extraer token según fuente especificada
      const token = extractToken(req, tokenSource);

      // Si no es requerido y no hay token, continuar sin autenticación
      if (!required && !token) {
        return next();
      }

      // Si es requerido y no hay token, denegar acceso
      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: "TOKEN_MISSING",
            title: "Acceso Denegado",
            message: "Se requiere autenticación para acceder a este recurso.",
            details: "Token no proporcionado en cookies ni headers",
          },
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Verificar token usando configuración centralizada
      const authConfig = config.auth || {};
      const secret = authConfig.secret?.access || process.env.JWT_ACCESS_SECRET;

      if (
        !secret ||
        secret.includes("default") ||
        secret.includes("change_me")
      ) {
        console.warn("⚠️  Usando secreto JWT por defecto");
      }

      const verifyOptions = {
        issuer: authConfig.issuer,
        audience: authConfig.audience,
        algorithms: [authConfig.algorithm || "HS256"],
        ignoreExpiration: allowExpired,
      };

      const decoded = jwt.verify(token, secret, verifyOptions);

      // 3. Validaciones adicionales del token
      validateTokenClaims(decoded, authConfig);

      // 4. Adjuntar información del usuario al request
      req.user = {
        id: decoded.sub || decoded.userId,
        userId: decoded.userId || decoded.sub,
        nombres: decoded.nombres,
        apellidos: decoded.apellidos,
        email: decoded.email,
        roles: Array.isArray(decoded.roles)
          ? decoded.roles
          : decoded.roles
          ? [decoded.roles]
          : [],
        id_pnf: decoded.id_pnf,
        primera_vez: decoded.primera_vez,
        tokenData: {
          tokenType: decoded.tokenType,
          issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : null,
          expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
          source: req.authSource || "unknown",
        },
      };

      // 5. Validar que no sea un refresh token en rutas que requieren access token
      if (decoded.tokenType === "refresh" && required) {
        return res.status(401).json({
          success: false,
          error: {
            code: "WRONG_TOKEN_TYPE",
            title: "Token Inválido",
            message: "Se requiere un access token, no un refresh token",
            details:
              "Use el endpoint /auth/refresh para obtener un nuevo access token",
          },
        });
      }

      // 6. Verificación de roles (si se especificaron roles requeridos)
      if (requiredRoles && requiredRoles.length > 0) {
        const hasPermission = checkUserRoles(req.user.roles, requiredRoles);

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: "INSUFFICIENT_PERMISSIONS",
              title: "Acceso Denegado",
              message: "Privilegios insuficientes para acceder a este recurso.",
              details: `Roles requeridos: ${requiredRoles.join(", ")}`,
              userRoles: req.user.roles,
            },
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // 7. Logging de autenticación exitosa
      if (process.env.LOG_AUTH_SUCCESS === "true") {
        console.log(
          `✅ Usuario autenticado: ${
            req.user.email || req.user.id
          } - Roles: ${req.user.roles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      // Manejo de errores específicos de JWT
      handleAuthError(error, req, res, required, next);
    }
  };
};

/**
 * Middleware de autenticación JWT para Socket.io
 *
 * ✅ Actualizado para usar el nuevo sistema de tokens
 */
export const socketAuth = (requiredRoles = [], options = {}) => {
  const { allowExpired = false } = options;

  return (socket, next) => {
    try {
      // Si ya tenemos socket.user, saltar la verificación
      if (socket.user) {
        return validateSocketRoles(socket, requiredRoles, next);
      }

      // Extraer token de cookies del handshake
      const token = extractSocketToken(socket);

      // Si no hay token, continuar como anónimo
      if (!token) {
        socket.isAnonymous = true;
        return next();
      }

      // Verificar token
      const authConfig = config.auth || {};
      const secret = authConfig.secret?.access || process.env.JWT_ACCESS_SECRET;

      const decoded = jwt.verify(token, secret, {
        issuer: authConfig.issuer,
        audience: authConfig.audience,
        algorithms: [authConfig.algorithm || "HS256"],
        ignoreExpiration: allowExpired,
      });

      // Validar claims
      validateTokenClaims(decoded, authConfig);

      // Adjuntar información del usuario al socket
      socket.user = {
        id: decoded.sub || decoded.userId,
        userId: decoded.userId || decoded.sub,
        nombres: decoded.nombres,
        apellidos: decoded.apellidos,
        email: decoded.email,
        roles: Array.isArray(decoded.roles)
          ? decoded.roles
          : decoded.roles
          ? [decoded.roles]
          : [],
        tokenData: {
          tokenType: decoded.tokenType,
          issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : null,
          expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
        },
      };

      // Unir al socket a la sala del usuario
      socket.join(`user_${socket.user.id}`);

      // Unir a salas por roles
      socket.user.roles.forEach((role) => {
        socket.join(`role_${role}`);
      });

      console.log(
        `📡 Socket conectado: ${socket.user.email || socket.user.id}`
      );

      // Validar roles si es necesario
      validateSocketRoles(socket, requiredRoles, next);
    } catch (error) {
      console.error("❌ Error de autenticación Socket.io:", error.message);
      socket.isAnonymous = true;
      next(); // Continuar como anónimo
    }
  };
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function extractToken(req, source = "auto") {
  let token = null;
  let extractedSource = "none";
  let allCookies = {};

  // DEBUG: Mostrar cookies y headers para diagnóstico
  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 [TOKEN DEBUG] ${req.method} ${req.path}`);
    console.log(`   Cookies (parsed):`, Object.keys(req.cookies || {}));
    console.log(`   Raw Cookie Header:`, req.headers.cookie || 'No presente');
    console.log(`   Headers Auth:`, req.headers.authorization ? 'Presente' : 'Ausente');
  }

  // 1. Recolectar TODAS las cookies posibles
  // a) De req.cookies (parsed por cookie-parser)
  if (req.cookies) {
    allCookies = { ...req.cookies };
  }
  
  // b) Del header raw 'Cookie' (por si cookie-parser no funcionó)
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';').map(cookie => cookie.trim());
    rawCookies.forEach(cookie => {
      const [name, ...valueParts] = cookie.split('=');
      if (name && valueParts.length > 0) {
        const value = valueParts.join('='); // Por si el valor tiene '='
        allCookies[name.trim()] = decodeURIComponent(value);
      }
    });
  }

  switch (source.toLowerCase()) {
    case "cookie":
      // Buscar en TODAS las cookies recolectadas
      token = allCookies.access_token || allCookies.autorization || allCookies.authorization;
      extractedSource = token ? "cookie" : "none";
      break;

    case "header":
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.substring(7);
        extractedSource = "header";
      }
      // También buscar en 'x-access-token', 'x-auth-token', etc.
      else if (req.headers['x-access-token']) {
        token = req.headers['x-access-token'];
        extractedSource = "custom_header";
      }
      else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
        extractedSource = "custom_header";
      }
      break;

    case "auto":
    default:
      // ✅ ESTRATEGIA DE BÚSQUEDA EN ORDEN:
      
      // 1. PRIMERO: Headers Authorization (Bearer token)
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.substring(7);
        extractedSource = "header";
      }
      // 2. SEGUNDO: Headers custom (x-access-token, x-auth-token)
      else if (req.headers['x-access-token']) {
        token = req.headers['x-access-token'];
        extractedSource = "custom_header";
      }
      else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
        extractedSource = "custom_header";
      }
      // 3. TERCERO: Cookies (access_token)
      else if (allCookies.access_token) {
        token = allCookies.access_token;
        extractedSource = "cookie";
      }
      // 4. CUARTO: Cookies (nombre antiguo: autorization)
      else if (allCookies.autorization) {
        token = allCookies.autorization;
        extractedSource = "cookie";
      }
      // 5. QUINTO: Cookies (authorization)
      else if (allCookies.authorization) {
        token = allCookies.authorization;
        extractedSource = "cookie";
      }
      // 6. SEXTO: Query parameter (útil para pruebas)
      else if (req.query.token) {
        token = req.query.token;
        extractedSource = "query";
      }
      break;
  }

  // Guardar fuente del token para debugging
  if (token) {
    req.authSource = extractedSource;
    req.tokenLocation = {
      source: extractedSource,
      allCookiesFound: Object.keys(allCookies),
      hasAuthHeader: !!req.headers.authorization,
      rawCookieHeader: req.headers.cookie ? 'Presente' : 'Ausente'
    };
  }

  // Log detallado
  if (process.env.NODE_ENV === "development") {
    if (token) {
      console.log(`✅ Token encontrado en: ${extractedSource}`);
      console.log(`   Método: ${req.method} ${req.path}`);
      console.log(`   Cookies encontradas:`, Object.keys(allCookies));
      console.log(`   Token (primeros 20 chars): ${token.substring(0, 20)}...`);
    } else if (req.path.includes('/api/') || req.path.includes('/auth/')) {
      console.warn(`⚠️  No se encontró token para: ${req.method} ${req.path}`);
      console.warn(`   Cookies disponibles:`, Object.keys(allCookies));
      console.warn(`   Auth Header:`, req.headers.authorization ? 'Presente' : 'Ausente');
      console.warn(`   Raw Cookie Header:`, req.headers.cookie || 'No presente');
    }
  }

  return token;
}

/**
 * Extrae token de socket.io handshake
 */
function extractSocketToken(socket) {
  const cookies = socket.handshake.headers.cookie;
  if (!cookies) return null;

  // Intentar con el nuevo nombre primero
  let token = getCookie(cookies, "access_token");
  if (!token) {
    // Fallback al nombre antiguo por compatibilidad
    token = getCookie(cookies, "autorization");
  }

  return token;
}

/**
 * Valida claims básicos del token
 */
function validateTokenClaims(decoded, authConfig) {
  // Validar issuer
  if (authConfig.issuer && decoded.iss !== authConfig.issuer) {
    throw new Error(
      `Issuer inválido: esperado ${authConfig.issuer}, recibido ${decoded.iss}`
    );
  }

  // Validar audience
  if (authConfig.audience && decoded.aud !== authConfig.audience) {
    throw new Error(
      `Audience inválido: esperado ${authConfig.audience}, recibido ${decoded.aud}`
    );
  }

  // Validar subject (requerido)
  if (!decoded.sub && !decoded.userId) {
    throw new Error("Token no contiene subject (sub) o userId");
  }
}

/**
 * Verifica roles del usuario
 */
function checkUserRoles(userRoles, requiredRoles) {
  if (!userRoles || !Array.isArray(userRoles)) {
    return false;
  }

  // SuperAdmin tiene acceso completo
  if (userRoles.includes("SuperAdmin")) {
    return true;
  }

  // Verificar si tiene al menos uno de los roles requeridos
  return userRoles.some((userRole) => requiredRoles.includes(userRole));
}

/**
 * Valida roles para socket
 */
function validateSocketRoles(socket, requiredRoles, next) {
  if (!requiredRoles || requiredRoles.length === 0 || !socket.user) {
    return next();
  }

  const hasPermission = checkUserRoles(socket.user.roles, requiredRoles);

  if (!hasPermission) {
    return next(
      new Error(
        JSON.stringify({
          code: "INSUFFICIENT_PERMISSIONS",
          title: "Acceso Denegado (Socket)",
          message: "Privilegios insuficientes para la conexión.",
          requiredRoles: requiredRoles,
          userRoles: socket.user.roles,
        })
      )
    );
  }

  next();
}

/**
 * Maneja errores de autenticación
 */
function handleAuthError(error, req, res, required, next) {
  // Si no es requerido y hay error, continuar sin autenticación
  if (!required) {
    console.warn(
      `⚠️  Token inválido pero autenticación no requerida: ${error.message}`
    );
    return next();
  }

  // Preparar respuesta de error
  const errorResponse = {
    success: false,
    error: {
      code: "AUTHENTICATION_ERROR",
      title: "Error de Autenticación",
      message: "Error al verificar credenciales",
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  // Errores específicos de JWT
  if (error.name === "TokenExpiredError") {
    errorResponse.error = {
      code: "TOKEN_EXPIRED",
      title: "Sesión Expirada",
      message: "Su sesión ha expirado, por favor inicie sesión nuevamente.",
      expiresAt: error.expiredAt
        ? new Date(error.expiredAt * 1000).toISOString()
        : null,
      details: `Token expiró a las ${
        error.expiredAt
          ? new Date(error.expiredAt * 1000).toISOString()
          : "desconocido"
      }`,
    };
    return res.status(401).json(errorResponse);
  }

  if (error.name === "JsonWebTokenError") {
    errorResponse.error = {
      code: "INVALID_TOKEN",
      title: "Token Inválido",
      message: "El token de autenticación es inválido o corrupto.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };
    return res.status(403).json(errorResponse);
  }

  if (
    error.message.includes("Issuer inválido") ||
    error.message.includes("Audience inválido")
  ) {
    errorResponse.error = {
      code: "TOKEN_MISMATCH",
      title: "Token no Compatible",
      message: "El token no es válido para este servidor.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };
    return res.status(403).json(errorResponse);
  }

  // Error genérico
  console.error("💥 Error de autenticación:", error);
  errorResponse.error.details =
    process.env.NODE_ENV === "development" ? error.message : undefined;
  return res.status(500).json(errorResponse);
}

/**
 * Middleware para refrescar tokens (nuevo)
 */
export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REFRESH_TOKEN_MISSING",
          title: "Token de Refresco Faltante",
          message: "Se requiere un refresh token para continuar",
        },
      });
    }

    // Aquí integrarías con tu JWTService.refreshAccessToken()
    // Por ahora, solo pasamos el token
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    console.error("❌ Error en refresh token middleware:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REFRESH_ERROR",
        title: "Error al Refrescar Token",
        message: "No se pudo procesar la solicitud de refresh",
      },
    });
  }
};

/**
 * Middleware para extraer y verificar token (para rutas mixtas)
 */
export const optionalAuth = (req, res, next) => {
  return middlewareAuth([], { required: false })(req, res, next);
};

/**
 * Función para generar un nuevo token (útil para desarrollo)
 */
export const generateTestToken = (userData = {}) => {
  const authConfig = config.auth || {};
  const secret = authConfig.secret?.access || process.env.JWT_ACCESS_SECRET;

  const payload = {
    sub: userData.id || "test_user_123",
    userId: userData.id || "test_user_123",
    nombres: userData.nombres || "Usuario",
    apellidos: userData.apellidos || "Test",
    email: userData.email || "test@example.com",
    roles: userData.roles || ["user"],
    id_pnf: userData.id_pnf || null,
    primera_vez: userData.primera_vez || false,
    tokenType: "access",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
    iss: authConfig.issuer,
    aud: authConfig.audience,
  };

  return jwt.sign(payload, secret, {
    algorithm: authConfig.algorithm || "HS256",
  });
};

// Exportar funciones auxiliares para testing
export const authUtils = {
  extractToken,
  validateTokenClaims,
  checkUserRoles,
  generateTestToken,
};
