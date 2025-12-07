/**
 * Configuración de seguridad completa para la aplicación
 * @param {Object} env - Variables de entorno
 * @returns {Object} Configuración completa de seguridad
 */
export default function securityConfig(env) {
  // Determinar entorno
  const isProduction = env.NODE_ENV === "production";
  const isDevelopment = env.NODE_ENV === "development";
  const isTesting = env.NODE_ENV === "test";

  return {
    // ========== ENVIRONMENT CONFIGURATION ==========
    environment: {
      mode: env.NODE_ENV || "development",
      isProduction,
      isDevelopment,
      isTesting,
      appName: env.APP_NAME || "UPTAMCA",
      appVersion: env.APP_VERSION || "1.0.0",
    },

    // ========== CORS CONFIGURATION ==========
    cors: {
      // Orígenes permitidos (separados por comas en .env)
      allowedOrigins: env.CORS_ALLOWED_ORIGINS
        ? env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173",
          ],

      // Validación dinámica de orígenes
      allowCredentials: env.CORS_ALLOW_CREDENTIALS !== "false",
      allowedMethods: (
        env.CORS_ALLOWED_METHODS || "GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD"
      )
        .split(",")
        .map((method) => method.trim()),

      allowedHeaders: (
        env.CORS_ALLOWED_HEADERS ||
        "Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,X-CSRF-Token,X-Request-ID,X-Client-Version,X-Api-Key"
      )
        .split(",")
        .map((header) => header.trim()),

      exposedHeaders: (
        env.CORS_EXPOSED_HEADERS ||
        "Authorization,X-CSRF-Token,X-Request-ID,X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset"
      )
        .split(",")
        .map((header) => header.trim()),

      // Configuración técnica
      preflightContinue: env.CORS_PREFLIGHT_CONTINUE === "true",
      optionsSuccessStatus: parseInt(env.CORS_OPTIONS_SUCCESS_STATUS) || 204,
      maxAge: parseInt(env.CORS_MAX_AGE) || 86400, // 24 horas en segundos

      // Comportamiento especial por entorno
      developmentBehavior: {
        allowAllOrigins: env.CORS_DEV_ALLOW_ALL === "true",
        logBlockedOrigins: env.CORS_DEV_LOG_BLOCKED !== "false",
        showDebugInfo: env.CORS_DEV_SHOW_DEBUG !== "false",
      },

      // Validación personalizada (para implementar en middleware)
      validation: {
        allowNullOrigin: env.CORS_ALLOW_NULL_ORIGIN === "true",
        allowMobileApps: env.CORS_ALLOW_MOBILE_APPS !== "false",
        allowChromeExtensions: env.CORS_ALLOW_CHROME_EXTENSIONS === "true",
        allowPostman: env.CORS_ALLOW_POSTMAN !== "false",
      },
    },

    // ========== HELMET HEADERS CONFIGURATION ==========
    helmet: {
      // Content Security Policy (CSP) - CRÍTICO para seguridad
      contentSecurityPolicy: {
        enabled: env.CSP_ENABLED !== "false",
        reportOnly: env.CSP_REPORT_ONLY === "true",
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'", // Solo en desarrollo
            ...(env.CSP_SCRIPT_SRC ? env.CSP_SCRIPT_SRC.split(",") : []),
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            ...(env.CSP_STYLE_SRC ? env.CSP_STYLE_SRC.split(",") : []),
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https:",
            ...(env.CSP_IMG_SRC ? env.CSP_IMG_SRC.split(",") : []),
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:",
            ...(env.CSP_FONT_SRC ? env.CSP_FONT_SRC.split(",") : []),
          ],
          connectSrc: [
            "'self'",
            env.API_URL || "http://localhost:3000",
            env.WS_URL || "ws://localhost:3000",
            ...(env.CSP_CONNECT_SRC ? env.CSP_CONNECT_SRC.split(",") : []),
          ],
          frameSrc: [
            "'self'",
            ...(env.CSP_FRAME_SRC ? env.CSP_FRAME_SRC.split(",") : []),
          ],
          mediaSrc: [
            "'self'",
            ...(env.CSP_MEDIA_SRC ? env.CSP_MEDIA_SRC.split(",") : []),
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },

      // Otros headers de seguridad
      hsts: {
        enabled: env.HSTS_ENABLED !== "false",
        maxAge: parseInt(env.HSTS_MAX_AGE) || 31536000, // 1 año
        includeSubDomains: env.HSTS_INCLUDE_SUBDOMAINS === "true",
        preload: env.HSTS_PRELOAD === "true",
      },

      // Cross-Origin Policies
      crossOriginEmbedderPolicy:
        env.CROSS_ORIGIN_EMBEDDER_POLICY || "require-corp",
      crossOriginOpenerPolicy: env.CROSS_ORIGIN_OPENER_POLICY || "same-origin",
      crossOriginResourcePolicy:
        env.CROSS_ORIGIN_RESOURCE_POLICY || "same-origin",

      // Headers varios
      dnsPrefetchControl: {
        allow: env.DNS_PREFETCH_CONTROL === "true",
      },
      frameguard: {
        action: env.FRAME_GUARD_ACTION || "DENY",
      },
      hidePoweredBy: env.HIDE_POWERED_BY !== "false",
      ieNoOpen: env.IE_NO_OPEN !== "false",
      noSniff: env.NO_SNIFF !== "false",
      permittedCrossDomainPolicies: {
        permittedPolicies: env.PERMITTED_CROSS_DOMAIN_POLICIES || "none",
      },
      referrerPolicy: {
        policy: env.REFERRER_POLICY || "strict-origin-when-cross-origin",
      },
      xssFilter: env.XSS_FILTER !== "false",
    },

    // ========== RATE LIMITING CONFIGURATION ==========
    rateLimit: {
      skipInDevelopment: isDevelopment && env.RATE_LIMIT_SKIP_IN_DEVELOPMENT !== "false",
      enabled: env.RATE_LIMIT_ENABLED !== "false",

      // Límites globales
      global: {
        windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
        max: parseInt(env.RATE_LIMIT_MAX) || 100, // 100 requests por ventana
        message:
          env.RATE_LIMIT_MESSAGE ||
          "Demasiadas solicitudes, por favor intente más tarde",
        standardHeaders: env.RATE_LIMIT_STANDARD_HEADERS === "true",
        legacyHeaders: env.RATE_LIMIT_LEGACY_HEADERS !== "false",
        skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESS === "true",
      },

      // Límites específicos por ruta
      routes: {
        login: {
          windowMs: parseInt(env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
          max: parseInt(env.LOGIN_RATE_LIMIT_MAX) || 5,
        },
        register: {
          windowMs:
            parseInt(env.REGISTER_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hora
          max: parseInt(env.REGISTER_RATE_LIMIT_MAX) || 3,
        },
        passwordReset: {
          windowMs:
            parseInt(env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
          max: parseInt(env.PASSWORD_RESET_RATE_LIMIT_MAX) || 3,
        },
        api: {
          windowMs: parseInt(env.API_RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minuto
          max: parseInt(env.API_RATE_LIMIT_MAX) || 60, // 60 requests por minuto
        },
        upload: {
          windowMs: parseInt(env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutos
          max: parseInt(env.UPLOAD_RATE_LIMIT_MAX) || 10,
        },
      },

      // Listas blancas/negras
      whitelist: env.RATE_LIMIT_WHITELIST
        ? env.RATE_LIMIT_WHITELIST.split(",").map((ip) => ip.trim())
        : [],
      blacklist: env.RATE_LIMIT_BLACKLIST
        ? env.RATE_LIMIT_BLACKLIST.split(",").map((ip) => ip.trim())
        : [],
    },

    // ========== CSRF PROTECTION CONFIGURATION ==========
    csrf: {
      enabled: env.CSRF_ENABLED !== "false",
      cookie: {
        key: env.CSRF_COOKIE_KEY || "_csrf",
        secure: env.CSRF_COOKIE_SECURE === "true" || isProduction,
        httpOnly: env.CSRF_COOKIE_HTTP_ONLY !== "false",
        sameSite: env.CSRF_COOKIE_SAME_SITE || "strict",
        path: env.CSRF_COOKIE_PATH || "/",
      },
      headerName: env.CSRF_HEADER_NAME || "X-CSRF-Token",
      value: (req) =>
        req.headers[env.CSRF_HEADER_NAME || "X-CSRF-Token"] || req.body._csrf,
      ignoreMethods: (env.CSRF_IGNORE_METHODS || "GET,HEAD,OPTIONS")
        .split(",")
        .map((method) => method.trim()),
    },

    // ========== MISC SECURITY SETTINGS ==========
    misc: {
      // Headers de servidor
      hideServerInfo: env.HIDE_SERVER_INFO !== "false",
      serverName: env.SERVER_NAME || "UPTAMCA Server",

      // Timeouts
      requestTimeout: parseInt(env.REQUEST_TIMEOUT) || 30000, // 30 segundos
      keepAliveTimeout: parseInt(env.KEEP_ALIVE_TIMEOUT) || 5000, // 5 segundos

      // Compression
      compression: env.COMPRESSION_ENABLED !== "false",
      compressionLevel: parseInt(env.COMPRESSION_LEVEL) || 6,
      compressionThreshold: parseInt(env.COMPRESSION_THRESHOLD) || 1024,

      // Cache control
      cacheControl:
        env.CACHE_CONTROL_HEADER || "no-store, no-cache, must-revalidate",
    },
  };
}
