import UserService from "../services/user.service.js";
import FormatterResponseController from "../utils/FormatterResponseController.js";

/**
 * Controlador principal para la gestión de operaciones de autenticación y usuarios.
 * Maneja las peticiones HTTP relacionadas con: inicio de sesión, verificación,
 * gestión de sesiones, recuperación de contraseña y administración de usuarios.
 * 
 * @module controllers/user.controller
 * @class UserController
 * @requires ../services/user.service
 * @requires ../utils/FormatterResponseController
 */
export default class UserController {
  /**
   * @typedef {Object} LoginRequest
   * @property {string} email - Correo electrónico del usuario
   * @property {string} password - Contraseña del usuario
   */

  /**
   * @typedef {Object} LoginResponse
   * @property {boolean} success - Indica si la operación fue exitosa
   * @property {Object} [data] - Datos adicionales en caso de éxito
   * @property {string} data.token - Token JWT de autenticación
   * @property {Object} data.user - Información básica del usuario
   * @property {string} data.user.id - ID único del usuario
   * @property {string} data.user.email - Email del usuario
   * @property {string} data.user.rol - Rol del usuario
   * @property {Object} [error] - Información de error en caso de fallo
   */

  /**
   * Inicia sesión de un usuario en el sistema.
   * Autentica las credenciales, genera un token JWT y establece una cookie HTTP-only.
   * 
   * @static
   * @async
   * @name login
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.body - Cuerpo de la petición
   * @param {string} req.body.email - Email del usuario
   * @param {string} req.body.password - Contraseña del usuario
   * @param {Object} [req.user] - Usuario pre-autenticado (si middleware ya validó)
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   * @throws {Error} - Error interno del servidor
   * 
   * @example
   * // Petición
   * POST /auth/login
   * {
   *   "email": "usuario@ejemplo.com",
   *   "password": "contraseña123"
   * }
   */
  static async login(req, res) {
    try {
      console.log(req.body, req.user);
      const resultado = await UserService.login(req.body, req.user);

      // Configurar cookie si el login fue exitoso
      if (resultado.success != undefined) {
        res.cookie("autorization", resultado.data.token, {
          maxAge: 1000 * 60 * 60 * 24, // 24 horas
          httpOnly: true,              // No accesible desde JavaScript
          secure: true,                // Solo en HTTPS
          sameSite: "none",            // Cross-site cookies permitidos
        });
      }

      return FormatterResponseController.respuestaServicio(res, resultado);
    } catch (error) {
      console.error("Error en login controller:", error);
      return FormatterResponseController.respuestaError(res, error);
    }
  }

  /**
   * Envía un token de recuperación al email del usuario.
   * Genera un token temporal y lo envía por email para recuperación de contraseña.
   * 
   * @static
   * @async
   * @name EnviarTokenEmail
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.body - Cuerpo de la petición
   * @param {string} req.body.email - Email del usuario que solicita recuperación
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async EnviarTokenEmail(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.EnviarTokenEmail(req.body)
    );
  }

  /**
   * Verifica la validez de un token de recuperación de contraseña.
   * Valida si el token proporcionado es correcto y no ha expirado.
   * 
   * @static
   * @async
   * @name VerificarToken
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.body - Cuerpo de la petición
   * @param {string} req.body.email - Email asociado al token
   * @param {string} req.body.token - Token de recuperación
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async VerificarToken(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.VerificarToken(req.body.email, req.body.token)
    );
  }

  /**
   * Verifica la sesión actual del usuario autenticado.
   * Retorna los datos del usuario basados en el token JWT presente en la petición.
   * 
   * @static
   * @async
   * @name verificarUsers
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.user - Usuario autenticado (inyectado por middleware)
   * @param {string} req.user.id - ID del usuario
   * @param {string} req.user.email - Email del usuario
   * @param {string} req.user.rol - Rol del usuario
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async verificarUsers(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.verificarSesion(req.user)
    );
  }

  /**
   * Cierra la sesión del usuario actual.
   * Invalida la sesión del usuario y elimina la cookie de autenticación.
   * 
   * @static
   * @async
   * @name closeSession
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.user - Usuario autenticado (inyectado por middleware)
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   * @throws {Error} - Si ocurre un error al procesar el cierre de sesión
   */
  static async closeSession(req, res) {
    try {
      // Limpiar cookie primero para asegurar que el cliente no pueda reautenticarse
      res.clearCookie("autorization", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/", // Asegura que se elimine de todas las rutas
      });

      // Ejecutar lógica de cierre de sesión en el servicio
      const resultado = await UserService.cerrarSesion();
      return FormatterResponseController.respuestaServicio(res, resultado);
    } catch (error) {
      console.error("Error en closeSession:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al cerrar sesión",
        error: error.message,
      });
    }
  }

  /**
   * Cambia la contraseña del usuario.
   * Permite cambiar la contraseña ya sea mediante token de recuperación
   * o mediante autenticación tradicional con contraseña actual.
   * 
   * @static
   * @async
   * @name cambiarContraseña
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.body - Cuerpo de la petición
   * @param {string} [req.body.currentPassword] - Contraseña actual (si está autenticado)
   * @param {string} req.body.newPassword - Nueva contraseña
   * @param {string} [req.body.token] - Token de recuperación
   * @param {string} [req.body.email] - Email asociado al token
   * @param {Object} [req.user] - Usuario autenticado (si aplica)
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async cambiarContraseña(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.cambiarContraseña(req.body, req.user)
    );
  }

  /**
   * Obtiene el perfil completo del usuario autenticado.
   * Retorna información detallada del usuario incluyendo datos personales,
   * preferencias y configuración.
   * 
   * @static
   * @async
   * @name obtenerPerfil
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.user - Usuario autenticado (inyectado por middleware)
   * @param {string} req.user.id - ID del usuario
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async obtenerPerfil(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.obtenerPerfil(req.user?.id)
    );
  }

  /**
   * Desactiva un usuario del sistema (soft delete).
   * Solo accesible para administradores con roles SuperAdmin o Vicerrector.
   * Cambia el estado del usuario a inactivo sin eliminar sus datos.
   * 
   * @static
   * @async
   * @name desactivarUsuario
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.user - Usuario administrador que ejecuta la acción
   * @param {string} req.user.id - ID del administrador
   * @param {Object} req.params - Parámetros de la ruta
   * @param {string} req.params.id_usuario - ID del usuario a desactivar
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async desactivarUsuario(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.desactivarUsuario(req.user.id, req.params.id_usuario)
    );
  }

  /**
   * Reactiva un usuario previamente desactivado.
   * Solo accesible para administradores con roles SuperAdmin o Vicerrector.
   * Restaura el acceso del usuario al sistema.
   * 
   * @static
   * @async
   * @name activarUsuario
   * @memberof UserController
   * @param {import('express').Request} req - Objeto de solicitud Express
   * @param {Object} req.user - Usuario administrador que ejecuta la acción
   * @param {string} req.user.id - ID del administrador
   * @param {Object} req.params - Parámetros de la ruta
   * @param {string} req.params.id_usuario - ID del usuario a activar
   * @param {import('express').Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async activarUsuario(req, res) {
    return FormatterResponseController.manejarServicio(
      res,
      UserService.activarUsuario(req.user.id, req.params.id_usuario)
    );
  }
}