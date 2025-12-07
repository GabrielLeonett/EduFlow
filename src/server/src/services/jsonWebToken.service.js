// services/jwt.service.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/index.js";

export class JWTService {
  constructor() {
    this.authConfig = config.auth || {};
    console.log("✅ JWTService inicializado con configuración:", {
      issuer: this.authConfig.issuer,
      audience: this.authConfig.audience,
      algorithm: this.authConfig.algorithm,
    });
  }

  /**
   * Crea un token de acceso
   * @param {Object} payload - Datos a incluir en el token
   * @param {Object} options - Opciones adicionales
   * @returns {string} Token JWT firmado
   */
  createAccessToken(payload, options = {}) {
    return this.createToken(payload, "access", options);
  }

  /**
   * Crea un token de refresco
   * @param {Object} payload - Datos a incluir en el token
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Token JWT de refresco con metadata
   */
  createRefreshToken(payload, options = {}) {
    const refreshPayload = {
      ...payload,
      tokenType: "refresh",
    };

    const refreshTokenString = this.generateRefreshTokenString();

    return {
      token: this.createToken(refreshPayload, "refresh", options),
      string: refreshTokenString,
    };
  }

  /**
   * Crea un token de reseteo de contraseña
   * @param {Object} payload - Datos a incluir en el token
   * @param {Object} options - Opciones adicionales
   * @returns {string} Token JWT de reseteo
   */
  createResetToken(payload, options = {}) {
    const resetPayload = {
      ...payload,
      tokenType: "reset",
    };

    return this.createToken(resetPayload, "reset", options);
  }

  /**
   * Crea un token de verificación de email
   * @param {Object} payload - Datos a incluir en el token
   * @param {Object} options - Opciones adicionales
   * @returns {string} Token JWT de verificación
   */
  createVerifyToken(payload, options = {}) {
    const verifyPayload = {
      ...payload,
      tokenType: "verify",
      jti: this.generateTokenId(),
    };

    return this.createToken(verifyPayload, "verify", options);
  }

  /**
   * Crea un token JWT genérico
   * @param {Object} payload - Datos a incluir en el token
   * @param {string} tokenType - Tipo de token (access, refresh, reset, verify)
   * @param {Object} options - Opciones adicionales
   * @returns {string} Token JWT firmado
   */
  createToken(payload, tokenType = "access", options = {}) {
    try {
      console.log(`🔐 Creando token ${tokenType}...`);

      // Validar payload
      if (!payload || typeof payload !== "object") {
        throw new Error("El payload debe ser un objeto válido");
      }

      // Obtener secreto según tipo de token
      const secret = this.getSecret(tokenType);
      if (
        !secret ||
        secret.includes("default") ||
        secret.includes("change_me")
      ) {
        console.warn(
          `⚠️  Advertencia: Usando secreto por defecto para ${tokenType} token`
        );
      }

      // Preparar payload estándar (SIN 'iss', 'aud', 'sub' aquí)
      const standardPayload = this.prepareStandardPayload(payload, tokenType);

      // Obtener opciones de firma (sin 'subject' si ya hay 'sub' en payload)
      const signOptions = this.getSignOptions(
        tokenType,
        options,
        standardPayload
      );

      // Depuración
      console.log("📋 Firmando token con:", {
        payloadKeys: Object.keys(standardPayload),
        hasSub: "sub" in standardPayload,
        signOptions: Object.keys(signOptions),
      });

      // Firmar el token
      const token = jwt.sign(standardPayload, secret, signOptions);

      console.log(`✅ Token ${tokenType} creado exitosamente`);
      return token;
    } catch (error) {
      console.error(`❌ Error creando token ${tokenType}:`, error);

      if (error.message.includes("subject") || error.message.includes("sub")) {
        throw new Error(
          `Error: Estás duplicando 'sub'/'subject'. ${error.message}`
        );
      }

      throw new Error(`Error al crear token ${tokenType}: ${error.message}`);
    }
  }

  /**
   * Verifica un token JWT
   * @param {string} token - Token JWT a verificar
   * @param {string} tokenType - Tipo de token esperado
   * @param {Object} options - Opciones adicionales de verificación
   * @returns {Object} Payload decodificado
   */
  verifyToken(token, tokenType = "access", options = {}) {
    try {
      if (!token) {
        throw new Error("Token no proporcionado");
      }

      const secret = this.getSecret(tokenType);
      const verifyOptions = this.getVerifyOptions(tokenType, options);
      const payload = jwt.verify(token, secret, verifyOptions);

      this.validateTokenClaims(payload, tokenType);

      console.log(`✅ Token ${tokenType} verificado exitosamente`);
      return payload;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error(`Token ${tokenType} expirado`);
      } else if (error.name === "JsonWebTokenError") {
        throw new Error(`Token ${tokenType} inválido: ${error.message}`);
      } else {
        throw new Error(
          `Error verificando token ${tokenType}: ${error.message}`
        );
      }
    }
  }

  /**
   * Decodifica un token sin verificar la firma
   * @param {string} token - Token JWT a decodificar
   * @returns {Object} Payload decodificado
   */
  decodeToken(token) {
    try {
      if (!token) {
        throw new Error("Token no proporcionado");
      }

      return jwt.decode(token, { complete: true });
    } catch (error) {
      throw new Error(`Error decodificando token: ${error.message}`);
    }
  }

  /**
   * Refresca un token de acceso usando un token de refresco
   * @param {string} refreshToken - Token de refresco
   * @param {Object} newPayload - Nuevos datos para el token
   * @returns {Object} Nuevo token de acceso y datos del refresco
   */
  refreshAccessToken(refreshToken, newPayload = {}) {
    try {
      const refreshPayload = this.verifyToken(refreshToken, "refresh");

      if (refreshPayload.tokenType !== "refresh") {
        throw new Error("Token no es un refresh token válido");
      }

      const accessToken = this.createAccessToken({
        ...refreshPayload,
        ...newPayload,
      });

      return {
        accessToken,
        refreshPayload: {
          jti: refreshPayload.jti,
          userId: refreshPayload.sub || refreshPayload.userId,
          expiresAt: refreshPayload.exp
            ? new Date(refreshPayload.exp * 1000)
            : null,
        },
      };
    } catch (error) {
      throw new Error(`Error refrescando token: ${error.message}`);
    }
  }

  /**
   * Crea una sesión completa con access y refresh tokens
   * @param {Object} userData - Datos del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Sesión completa
   */
  createSession(userData, options = {}) {
    try {
      console.log("🎫 Creando sesión JWT...");

      const {
        id,
        apellidos = "",
        nombres = "",
        roles = [],
        email = "",
        id_pnf = null,
        primera_vez = false,
      } = userData;

      if (!id) {
        throw new Error("El ID del usuario es requerido");
      }

      // Crear payload base para tokens
      const tokenPayload = {
        sub: id.toString(), // ✅ 'sub' en el payload
        userId: id,
        apellidos,
        nombres,
        roles,
        email,
        ...(id_pnf && { id_pnf }),
        primera_vez,
      };

      // Crear access token
      const accessToken = this.createAccessToken(tokenPayload, options);

      // Crear refresh token
      const refreshResult = this.createRefreshToken(tokenPayload, options);
      const refreshToken = refreshResult.token;
      const refreshTokenString = refreshResult.string;
      const jti = refreshResult.jti;

      const accessExpiry = this.calculateExpiry("access");
      const refreshExpiry = this.calculateExpiry("refresh");

      return {
        access: accessToken,
        refresh: refreshToken,
        metadata: {
          userId: id,
          userEmail: email,
          userRole: roles.length > 0 ? roles[0] : null,
          userRoles: roles,
          userNombres: nombres,
          userApellidos: apellidos,
          jti,
          accessExpiresAt: accessExpiry,
          refreshExpiresAt: refreshExpiry,
          issuedAt: new Date(),
          sessionId: this.generateSessionId(),
          ...(id_pnf && { idPnf: id_pnf }),
          primeraVez: primera_vez,
        },
        user: {
          id,
          apellidos,
          nombres,
          email,
          roles,
          ...(id_pnf && { id_pnf }),
          primera_vez,
        },
        cookieOptions: this.getCookieOptions(),
        expiresIn: {
          access: this.authConfig.expiresIn?.access || "15m",
          refresh: this.authConfig.expiresIn?.refresh || "7d",
        },
      };
    } catch (error) {
      console.error("❌ Error creando sesión:", error);
      throw new Error(`Error creando sesión: ${error.message}`);
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Obtiene el secreto según el tipo de token
   * @private
   */
  getSecret(tokenType) {
    if (!this.authConfig.secret) {
      throw new Error("Configuración de secretos JWT no encontrada");
    }

    const secretMap = {
      access: this.authConfig.secret.access,
      refresh: this.authConfig.secret.refresh,
      reset: this.authConfig.secret.reset,
      verify: this.authConfig.secret.verify,
    };

    const secret = secretMap[tokenType] || this.authConfig.secret.access;

    if (!secret) {
      throw new Error(`Secreto para token ${tokenType} no configurado`);
    }

    return secret;
  }

  /**
   * Prepara el payload estándar para un token
   * @private
   */
  prepareStandardPayload(payload, tokenType) {
    const now = Math.floor(Date.now() / 1000);

    // Payload base - NO agregar 'iss', 'aud', 'subject' aquí
    const standardPayload = {
      ...payload,
      iat: now, // Issued At
      tokenType: tokenType,
    };

    // Asegurar que 'sub' existe y es string
    if (!standardPayload.sub && standardPayload.userId) {
      standardPayload.sub = standardPayload.userId.toString();
    }

    if (standardPayload.sub && typeof standardPayload.sub !== "string") {
      standardPayload.sub = standardPayload.sub.toString();
    }

    // Filtrar propiedades undefined
    Object.keys(standardPayload).forEach((key) => {
      if (standardPayload[key] === undefined) {
        delete standardPayload[key];
      }
    });

    return standardPayload;
  }

  /**
   * Obtiene las opciones de firma para un token
   * @private
   */
  getSignOptions(tokenType, customOptions = {}, payload = {}) {
    const expiresIn =
      this.authConfig.expiresIn?.[tokenType] ||
      this.authConfig.expiresIn?.access ||
      "15m";

    const baseOptions = {
      expiresIn,
      algorithm: this.authConfig.algorithm || "HS256",
    };

    // Solo agregar issuer y audience si están configurados
    if (this.authConfig.issuer) {
      baseOptions.issuer = this.authConfig.issuer;
    }

    if (this.authConfig.audience) {
      baseOptions.audience = this.authConfig.audience;
    }

    // ❌ IMPORTANTE: NO agregar 'subject' si ya hay 'sub' en el payload
    // Solo agregar subject si NO hay 'sub' en el payload
    if (!payload.sub && this.authConfig.subject) {
      baseOptions.subject = this.authConfig.subject;
    }

    // Agregar JWT ID si está configurado
    if (this.authConfig.jwtid && !customOptions.jwtid) {
      baseOptions.jwtid = `${this.authConfig.jwtid}${Date.now()}`;
    }

    // Filtrar options para no duplicar con payload
    const finalOptions = { ...baseOptions, ...customOptions };

    // Remover 'subject' si ya hay 'sub' en payload
    if (payload.sub && finalOptions.subject) {
      console.warn(
        "⚠️  Removiendo 'subject' de opciones porque 'sub' ya está en el payload"
      );
      delete finalOptions.subject;
    }

    return finalOptions;
  }

  /**
   * Obtiene las opciones de verificación para un token
   * @private
   */
  getVerifyOptions(tokenType, customOptions = {}) {
    const verifyOptions = {
      algorithms: [this.authConfig.algorithm || "HS256"],
      ignoreExpiration: false,
      ignoreNotBefore: false,
      ...customOptions,
    };

    if (this.authConfig.issuer) {
      verifyOptions.issuer = this.authConfig.issuer;
    }

    if (this.authConfig.audience) {
      verifyOptions.audience = this.authConfig.audience;
    }

    return verifyOptions;
  }

  /**
   * Valida los claims específicos de un token
   * @private
   */
  validateTokenClaims(payload, tokenType) {
    if (payload.tokenType && payload.tokenType !== tokenType) {
      throw new Error(
        `Token type mismatch: expected ${tokenType}, got ${payload.tokenType}`
      );
    }

    if (this.authConfig.requiredClaims) {
      this.authConfig.requiredClaims.forEach((claim) => {
        if (!payload[claim]) {
          throw new Error(`Claim requerido faltante: ${claim}`);
        }
      });
    }

    if (this.authConfig.issuer && payload.iss !== this.authConfig.issuer) {
      throw new Error(
        `Issuer inválido: expected ${this.authConfig.issuer}, got ${payload.iss}`
      );
    }

    if (this.authConfig.audience && payload.aud !== this.authConfig.audience) {
      throw new Error(
        `Audience inválido: expected ${this.authConfig.audience}, got ${payload.aud}`
      );
    }

    if (!payload.sub) {
      throw new Error("Claim 'sub' (subject) faltante en el token");
    }
  }

  /**
   * Genera un ID único para el token
   * @private
   */
  generateTokenId() {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Genera un string para refresh token
   * @private
   */
  generateRefreshTokenString() {
    const length = this.authConfig.refreshToken?.length || 64;
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Genera un ID único para la sesión
   * @private
   */
  generateSessionId() {
    return `sess_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  /**
   * Calcula la fecha de expiración para un token
   * @private
   */
  calculateExpiry(tokenType) {
    const expiresIn = this.authConfig.expiresIn?.[tokenType];
    if (!expiresIn) return null;

    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (match) {
      const [, value, unit] = match;
      let ms = parseInt(value);

      switch (unit) {
        case "s":
          ms *= 1000;
          break;
        case "m":
          ms *= 1000 * 60;
          break;
        case "h":
          ms *= 1000 * 60 * 60;
          break;
        case "d":
          ms *= 1000 * 60 * 60 * 24;
          break;
        default:
          return null;
      }

      return new Date(now.getTime() + ms);
    }

    if (!isNaN(expiresIn)) {
      return new Date(now.getTime() + parseInt(expiresIn) * 1000);
    }

    return null;
  }

  /**
   * Obtiene opciones para cookies
   * @private
   */
  getCookieOptions() {
    return {
      secure:
        this.authConfig.cookies?.secure ||
        process.env.NODE_ENV === "production",
      httpOnly: this.authConfig.cookies?.httpOnly !== false,
      sameSite: this.authConfig.cookies?.sameSite || "strict",
      path: this.authConfig.cookies?.path || "/",
      domain: this.authConfig.cookies?.domain || undefined,
      maxAge: this.authConfig.cookies?.maxAge || 7 * 24 * 60 * 60 * 1000,
    };
  }

  /**
   * Extrae el token de un header Authorization
   * @param {string} authHeader - Header Authorization
   * @returns {string|null} Token extraído
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || typeof authHeader !== "string") {
      return null;
    }

    const bearerPrefix = this.authConfig.tokenNames?.bearer || "Bearer";
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== bearerPrefix) {
      return null;
    }

    return parts[1];
  }

  /**
   * Método de debug para inspeccionar configuración
   */
  debugConfig() {
    const payload = {
      sub: "test123",
      userId: 123,
      name: "Test User",
    };

    try {
      console.log("🔧 Debug JWT Configuration:");
      console.log("1. Configuración actual:", {
        issuer: this.authConfig.issuer,
        audience: this.authConfig.audience,
        subject: this.authConfig.subject,
        algorithm: this.authConfig.algorithm,
      });

      console.log("2. Probando createToken...");
      const token = this.createToken(payload, "access");

      console.log("3. Token creado exitosamente");
      const decoded = jwt.decode(token);
      console.log("4. Token decodificado:", {
        hasSub: "sub" in decoded,
        sub: decoded.sub,
        hasIss: "iss" in decoded,
        iss: decoded.iss,
        hasAud: "aud" in decoded,
        aud: decoded.aud,
      });

      return { success: true, token };
    } catch (error) {
      console.error("❌ Debug error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

// Instancia singleton
const jwtService = new JWTService();

export default jwtService;
