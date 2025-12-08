// controllers/user.controller.js
import UserService from "../services/user.service.js";
import FormatterResponseController from "../utils/FormatterResponseController.js";
import config from "../config/index.js";

/**
 * Controlador principal para la gestión de operaciones de autenticación y usuarios.
 */
export default class UserController {
  /**
   * Inicia sesión de un usuario en el sistema.
   */
  /**
   * Inicia sesión de un usuario en el sistema.
   */
  static async login(req, res) {
    try {
      console.log("🔐 [Controller] Iniciando proceso de login...");

      // 1. VALIDACIONES BÁSICAS (FALTABAN)
      if (!req.body || typeof req.body !== "object") {
        return FormatterResponseController.validationError(res, {
          error: "Datos de entrada inválidos",
        });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        const missing = [];
        if (!email) missing.push("email");
        if (!password) missing.push("password");

        return FormatterResponseController.validationError(res, {
          message: "Campos requeridos faltantes",
          missingFields: missing,
          details: `Faltan: ${missing.join(", ")}`,
        });
      }

      // 2. Verificar que no haya sesión activa
      if (req.user) {
        console.warn("⚠️  Intento de login con sesión activa:", req.user.id);

        return FormatterResponseController.error(
          res,
          "Ya tienes una sesión activa. Por favor, cierra sesión primero.",
          409, // Conflict - ya hay sesión activa
          "ACTIVE_SESSION_EXISTS",
          {
            userId: req.user.id,
            userEmail: req.user.email,
            currentSession: {
              issuedAt: req.user.iat ? new Date(req.user.iat * 1000) : null,
              expiresAt: req.user.exp ? new Date(req.user.exp * 1000) : null,
            },
          }
        );
      }

      // 3. Delegar lógica de autenticación al servicio
      console.log("📧 Procesando login para:", email);
      const resultado = await UserService.login(req.body, req.user);


      // 4. Si el login fue exitoso, configurar cookies de manera segura
      if (resultado.data?.tokens) {
        // Configurar cookies
        await UserController.setSecureCookies(
          res,
          resultado.data.tokens,
          resultado.data.metadata
        );

        // Crear respuesta segura sin tokens en JSON
        const safeResponse = {
          ...resultado,
          data: {
            user: resultado.data.user,
            metadata: {
              ...resultado.data.metadata,
              // No enviar tokens en la respuesta JSON
              accessToken: undefined,
              refreshToken: undefined,
            },
          },
        };

        console.log("✅ Login exitoso para:", email);
        console.log("📤 Enviando respuesta al cliente:", {
          status: safeResponse.status,
          usuario: safeResponse.data.user?.email,
          cookiesConfiguradas: true,
        });

        return res.json(safeResponse);
      }

      // 5. Si el login falló, devolver error sin cookies
      console.error("❌ Login fallido para:", email, resultado);
      console.log("🔍 Llamando a respuesta con error...");
      const respuestaError = FormatterResponseController.respuesta(
        res,
        resultado
      );
      console.log("📤 Respuesta (error) devolvió:", respuestaError);
      return respuestaError;
    } catch (error) {
      console.error("💥 Error crítico en login controller:", error);
      const respuestaErrorFinal = FormatterResponseController.respuestaError(
        res,
        {
          status: 500,
          title: "Error Interno del Servidor",
          message: "Ocurrió un error al procesar tu solicitud de login",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
          code: "LOGIN_PROCESSING_ERROR",
        }
      );
      return respuestaErrorFinal;
    }
  }

  /**
   * Configura cookies de manera segura
   * @private
   */
  static async setSecureCookies(res, tokens, metadata) {
    try {
      console.log("🔧 Configurando cookies seguras...");
      console.log("🍪 Utilizando setSecureCookies con tokens:", {
        tieneAccessToken: !!tokens?.access,
        tieneRefreshToken: !!tokens?.refresh,
        metadata: metadata,
      });

      const authConfig = config.auth || {};
      const cookieConfig = authConfig.cookies || {};
      const securityConfig = config.security || {};
      const isProduction =
        securityConfig.environment?.isProduction ||
        process.env.NODE_ENV === "production";

      // Configuración base para cookies
      const baseCookieOptions = {
        httpOnly: cookieConfig.httpOnly !== false, // true por defecto
        secure: cookieConfig.secure || isProduction, // true en producción
        sameSite: cookieConfig.sameSite || "strict", // "strict" por defecto
        path: cookieConfig.path || "/",
        domain: cookieConfig.domain || undefined,
        // Añadir flags de seguridad adicionales
        partitioned: false, // Para futuras implementaciones de CHIPS
      };

      // ========== ACCESS TOKEN COOKIE ==========
      if (tokens.access) {
        const accessExpiresIn = authConfig.expiresIn?.access || "15m";
        const accessMaxAge = UserController.parseExpiresInToMs(accessExpiresIn);

        res.cookie("access_token", tokens.access, {
          ...baseCookieOptions,
          maxAge: accessMaxAge,
          expires: new Date(Date.now() + accessMaxAge),
        });

        console.log("🍪 Cookie access_token configurada:", {
          maxAge: `${accessMaxAge}ms (${accessExpiresIn})`,
          secure: baseCookieOptions.secure,
          httpOnly: baseCookieOptions.httpOnly,
          sameSite: baseCookieOptions.sameSite,
        });
      }

      // ========== REFRESH TOKEN COOKIE ==========
      if (tokens.refresh) {
        const refreshExpiresIn = authConfig.expiresIn?.refresh || "7d";
        const refreshMaxAge =
          UserController.parseExpiresInToMs(refreshExpiresIn);

        res.cookie("refresh_token", tokens.refresh, {
          ...baseCookieOptions,
          maxAge: refreshMaxAge,
          expires: new Date(Date.now() + refreshMaxAge),
        });

        console.log("🍪 Cookie refresh_token configurada:", {
          maxAge: `${refreshMaxAge}ms (${refreshExpiresIn})`,
          secure: baseCookieOptions.secure,
          httpOnly: true,
          sameSite: baseCookieOptions.sameSite,
        });
      }

      // ========== SESSION COOKIE (opcional) ==========
      if (metadata?.sessionId) {
        res.cookie("session_id", metadata.sessionId, {
          ...baseCookieOptions,
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "lax",
        });
      }

      // Headers adicionales de seguridad
      res.setHeader("X-Auth-Method", "cookie");
      res.setHeader("X-Token-Type", "jwt");

      console.log("✅ Cookies configuradas exitosamente");
    } catch (error) {
      console.error("❌ Error configurando cookies:", error);
      throw new Error(`Error de configuración de cookies: ${error.message}`);
    }
  }

  /**
   * Parsea strings como "15m", "1h", "7d" a milisegundos
   * @private
   */
  static parseExpiresInToMs(expiresIn) {
    if (!expiresIn) return 15 * 60 * 1000; // 15 minutos por defecto

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Si es un número directo (segundos)
      const seconds = parseInt(expiresIn);
      if (!isNaN(seconds)) return seconds * 1000;
      return 15 * 60 * 1000; // 15 minutos por defecto
    }

    const [, value, unit] = match;
    const numValue = parseInt(value);

    switch (unit.toLowerCase()) {
      case "s":
        return numValue * 1000; // segundos
      case "m":
        return numValue * 60 * 1000; // minutos
      case "h":
        return numValue * 60 * 60 * 1000; // horas
      case "d":
        return numValue * 24 * 60 * 60 * 1000; // días
      default:
        return 15 * 60 * 1000; // 15 minutos por defecto
    }
  }

  /**
   * Cierra la sesión del usuario actual de manera segura
   */
  static async closeSession(req, res) {
    try {
      console.log("🚪 [Controller] Cerrando sesión...");

      // 1. Limpiar todas las cookies de autenticación
      const authConfig = config.auth || {};
      const cookieConfig = authConfig.cookies || {};
      const securityConfig = config.security || {};
      const isProduction =
        securityConfig.environment?.isProduction ||
        process.env.NODE_ENV === "production";

      const cookieOptions = {
        httpOnly: cookieConfig.httpOnly !== false,
        secure: cookieConfig.secure || isProduction,
        sameSite: cookieConfig.sameSite || "strict",
        path: cookieConfig.path || "/",
        domain: cookieConfig.domain || undefined,
      };

      // Limpiar todas las cookies posibles
      ["access_token", "refresh_token", "session_id", "autorization"].forEach(
        (cookieName) => {
          res.clearCookie(cookieName, cookieOptions);
          console.log(`🧹 Cookie limpiada: ${cookieName}`);
        }
      );

      // 2. Incluir headers que indiquen que la sesión fue cerrada
      res.setHeader("X-Session-Status", "closed");
      res.setHeader("X-Session-Closed-At", new Date().toISOString());

      // 3. Ejecutar lógica de cierre de sesión en el servicio
      const resultado = await UserService.cerrarSesion();

      // 4. Retornar respuesta
      console.log("✅ Sesión cerrada exitosamente");
      return FormatterResponseController.respuestaServicio(res, {
        ...resultado,
        metadata: {
          ...resultado.metadata,
          logoutTime: new Date().toISOString(),
          cookiesCleared: ["access_token", "refresh_token", "session_id"],
        },
      });
    } catch (error) {
      console.error("💥 Error en closeSession:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error al cerrar sesión",
        message: "No se pudo cerrar la sesión correctamente",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        code: "LOGOUT_PROCESSING_ERROR",
      });
    }
  }

  /**
   * Envía un token de recuperación al email del usuario.
   */
  static async EnviarTokenEmail(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.EnviarTokenEmail(req.body)
    );
  }

  /**
   * Verifica la validez de un token de recuperación de contraseña.
   */
  static async VerificarToken(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.VerificarToken(req.body.email, req.body.token)
    );
  }

  /**
   * Verifica la sesión actual del usuario autenticado.
   */
  static async verificarUsers(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.verificarSesion(req.user)
    );
  }

  /**
   * Cambia la contraseña del usuario.
   */
  static async cambiarContraseña(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.cambiarContraseña(req.body, req.user)
    );
  }

  /**
   * Obtiene el perfil completo del usuario autenticado.
   */
  static async obtenerPerfil(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.obtenerPerfil(req.user?.id)
    );
  }

  /**
   * Desactiva un usuario del sistema (soft delete).
   */
  static async desactivarUsuario(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.desactivarUsuario(req.user.id, req.params.id_usuario)
    );
  }

  /**
   * Reactiva un usuario previamente desactivado.
   */
  static async activarUsuario(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.activarUsuario(req.user.id, req.params.id_usuario)
    );
  }

  /**
   * Método para refrescar el token de acceso usando el refresh token
   */
  static async refreshToken(req, res) {
    try {
      console.log("🔄 [Controller] Refrescando token...");

      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return FormatterResponseController.validationError(res, {
          message: "Refresh token no proporcionado",
          code: "REFRESH_TOKEN_MISSING",
        });
      }

      const resultado = await UserService.refreshToken(refreshToken);

      if (resultado.data?.tokens) {
        await UserController.setSecureCookies(
          res,
          resultado.data.tokens,
          resultado.data.metadata
        );

        // Crear respuesta segura sin tokens en JSON
        const safeResponse = {
          ...resultado,
          data: {
            user: resultado.data.user,
            metadata: {
              ...resultado.data.metadata,
              accessToken: undefined,
              refreshToken: undefined,
            },
          },
        };

        console.log("✅ Token refrescado exitosamente");
        return FormatterResponseController.respuestaServicio(res, safeResponse);
      }

      return FormatterResponseController.respuesta(res, resultado);
    } catch (error) {
      console.error("💥 Error refrescando token:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error al refrescar token",
        message: "No se pudo refrescar el token de acceso",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        code: "TOKEN_REFRESH_ERROR",
      });
    }
  }

  /**
   * Verifica el estado de autenticación actual
   */
  static async checkAuthStatus(req, res) {
    try {
      const authStatus = {
        isAuthenticated: !!req.user,
        user: req.user
          ? {
              id: req.user.id,
              email: req.user.email,
              role: req.user.role,
            }
          : null,
        tokenSource: req.authSource,
        hasAccessToken: !!req.cookies?.access_token,
        hasRefreshToken: !!req.cookies?.refresh_token,
        timestamp: new Date().toISOString(),
      };

      return FormatterResponseController.respuestaServicio(res, {
        status: 200,
        data: authStatus,
        metadata: {
          message: "Estado de autenticación verificado",
          code: "AUTH_STATUS_CHECKED",
        },
      });
    } catch (error) {
      console.error("💥 Error verificando estado de autenticación:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error al verificar autenticación",
        message: "No se pudo verificar el estado de autenticación",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        code: "AUTH_STATUS_ERROR",
      });
    }
  }
}
