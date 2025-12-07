/**
 * Configuración de autenticación JWT para la aplicación
 * @param {Object} env - Variables de entorno
 * @returns {Object} Configuración completa de autenticación
 */
export default function authConfig(env) {
  return {
    // ========== JWT CONFIGURATION ==========

    // Secretos para firmar tokens (obligatorios en producción)
    secret: {
      access:
        env.JWT_ACCESS_SECRET ||
        env.AUTH_SECRET_KEY ||
        "default_access_secret_change_me",
      refresh:
        env.JWT_REFRESH_SECRET ||
        env.JWT_ACCESS_SECRET ||
        "default_refresh_secret_change_me",
      reset: env.JWT_RESET_SECRET || "default_reset_secret_change_me",
      verify: env.JWT_VERIFY_SECRET || "default_verify_secret_change_me",
    },

    // Tiempos de expiración (en segundos o string de ms)
    expiresIn: {
      access: env.JWT_ACCESS_EXPIRES_IN || "15m", // 15 minutos
      refresh: env.JWT_REFRESH_EXPIRES_IN || "7d", // 7 días
      reset: env.JWT_RESET_EXPIRES_IN || "1h", // 1 hora
      verify: env.JWT_VERIFY_EXPIRES_IN || "24h", // 24 horas
      short: env.JWT_SHORT_EXPIRES_IN || "5m", // 5 minutos
      long: env.JWT_LONG_EXPIRES_IN || "30d", // 30 días
    },

    // Configuración del algoritmo
    algorithm: env.JWT_ALGORITHM || "HS256",

    // Emisor y audiencia
    issuer: env.JWT_ISSUER || "uptamca-api",
    audience: env.JWT_AUDIENCE || "uptamca-client",

    // Subject (puede ser configurado dinámicamente)
    subject: env.JWT_SUBJECT || "user-auth",

    // ID del token (JTI) - opcional
    jwtid: env.JWT_ID_PREFIX || "jti_",

    // ========== TOKEN CONFIGURATION ==========

    // Nombres de los tokens en cookies/headers
    tokenNames: {
      access: env.ACCESS_TOKEN_NAME || "access_token",
      refresh: env.REFRESH_TOKEN_NAME || "refresh_token",
      reset: env.RESET_TOKEN_NAME || "reset_token",
      verify: env.VERIFY_TOKEN_NAME || "verify_token",
      bearer: env.BEARER_TOKEN_PREFIX || "Bearer",
    },

    // Lugares donde buscar los tokens
    tokenSources: (env.TOKEN_SOURCES || "header,cookie").split(","),

    // Configuración de cookies para tokens
    cookies: {
      secure:
        env.NODE_ENV === "production" || env.TOKEN_COOKIE_SECURE === "true",
      httpOnly: env.TOKEN_COOKIE_HTTP_ONLY !== "false",
      sameSite: env.TOKEN_COOKIE_SAME_SITE || "strict",
      path: env.TOKEN_COOKIE_PATH || "/",
      domain: env.TOKEN_COOKIE_DOMAIN || undefined,
      maxAge: parseInt(env.TOKEN_COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000, // 7 días en ms
    },

    // ========== SECURITY CONFIGURATION ==========

    // Bcrypt salt rounds
    bcryptRounds: parseInt(env.BCRYPT_SALT_ROUNDS) || 10,

    // Límites de seguridad
    limits: {
      maxLoginAttempts: parseInt(env.MAX_LOGIN_ATTEMPTS) || 5,
      lockoutTime: parseInt(env.LOCKOUT_TIME_MINUTES) || 15, // minutos
      tokenRefreshLimit: parseInt(env.TOKEN_REFRESH_LIMIT) || 5, // máx refrescos por token
      passwordMinLength: parseInt(env.PASSWORD_MIN_LENGTH) || 8,
      passwordRequires: {
        uppercase: env.PASSWORD_REQUIRE_UPPERCASE !== "false",
        lowercase: env.PASSWORD_REQUIRE_LOWERCASE !== "false",
        number: env.PASSWORD_REQUIRE_NUMBER !== "false",
        symbol: env.PASSWORD_REQUIRE_SYMBOL !== "false",
      },
    },

    // ========== VALIDATION CONFIGURATION ==========

    // Campos requeridos en el payload del token
    requiredClaims: (env.JWT_REQUIRED_CLAIMS || "sub,iat,exp,iss").split(","),

    // Claims adicionales para incluir en tokens
    additionalClaims: (
      env.JWT_ADDITIONAL_CLAIMS || "role,email,name,userId"
    ).split(","),

    // Blacklist de tokens (para logout)
    useBlacklist: env.USE_TOKEN_BLACKLIST === "true",
    blacklistTtl: parseInt(env.BLACKLIST_TTL_HOURS) || 24, // horas

    // ========== REFRESH TOKEN CONFIGURATION ==========

    refreshToken: {
      length: parseInt(env.REFRESH_TOKEN_LENGTH) || 64, // caracteres
      store: env.REFRESH_TOKEN_STORE || "database", // database, redis, memory
      reuseDetection: env.REFRESH_TOKEN_REUSE_DETECTION === "true",
      familyLimit: parseInt(env.REFRESH_TOKEN_FAMILY_LIMIT) || 5, // máx tokens por familia
    },

    // ========== OAUTH & SOCIAL CONFIGURATION ==========

    oauth: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || "",
        callbackUrl: env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID || "",
        clientSecret: env.GITHUB_CLIENT_SECRET || "",
        callbackUrl: env.GITHUB_CALLBACK_URL || "/auth/github/callback",
      },
    },

    // ========== RATE LIMITING ==========

    rateLimit: {
      login: {
        windowMs: parseInt(env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
        max: parseInt(env.LOGIN_RATE_LIMIT_MAX) || 5, // 5 intentos
      },
      tokenRefresh: {
        windowMs: parseInt(env.REFRESH_RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minuto
        max: parseInt(env.REFRESH_RATE_LIMIT_MAX) || 3, // 3 refrescos
      },
    },
  };
}
