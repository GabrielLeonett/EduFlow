import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import UserController from "../controllers/user.controller.js";

// Desestructuración de métodos del controlador
const {
  login,
  verificarUsers,
  closeSession,
  cambiarContraseña,
  EnviarTokenEmail,
  VerificarToken,
  desactivarUsuario,
  activarUsuario,
  obtenerPerfil,
} = UserController;

/**
 * Router para el módulo de autenticación y gestión de usuarios.
 * Este router maneja todas las rutas relacionadas con autenticación,
 * recuperación de contraseña, gestión de sesiones y administración de usuarios.
 * 
 * @module routes/UserRouter
 * @requires express
 * @requires ../middlewares/auth
 * @requires ../controllers/user.controller
 * @class
 * @type {express.Router}
 */
export const UserRouter = Router();

/**
 * =============================================
 * RUTAS PÚBLICAS (Sin autenticación requerida)
 * =============================================
 */

/**
 * @route POST /auth/login
 * @group Autenticación - Operaciones de inicio de sesión
 * @summary Iniciar sesión en el sistema
 * @description Autentica a un usuario mediante email y contraseña. 
 *              Genera un token JWT en caso de éxito.
 * @param {Object} req.body - Datos de autenticación
 * @param {string} req.body.email - Email del usuario (formato válido requerido)
 * @param {string} req.body.password - Contraseña del usuario (mínimo 6 caracteres)
 * @returns {Object} 200 - Token de autenticación y datos básicos del usuario
 * @returns {Error} 400 - Credenciales inválidas o formato incorrecto
 * @returns {Error} 401 - Usuario inactivo o no autorizado
 * @returns {Error} 404 - Usuario no encontrado
 * @returns {Error} 500 - Error interno del servidor
 * @example {json} Request
 * {
 *   "email": "usuario@ejemplo.com",
 *   "password": "contraseña123"
 * }
 * @example {json} Response
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "abc123",
 *     "email": "usuario@ejemplo.com",
 *     "rol": "Estudiante"
 *   }
 * }
 */
UserRouter.post("/auth/login", middlewareAuth([], { required: false }), login);

/**
 * =============================================
 * RUTAS DE AUTENTICACIÓN
 * (Requieren token válido, excepto donde se indique)
 * =============================================
 */

/**
 * @route GET /auth/verify
 * @group Autenticación - Operaciones de verificación
 * @summary Verificar token de autenticación
 * @description Valida el token JWT actual y retorna los datos del usuario autenticado.
 *              Se utiliza para mantener sesiones activas en el frontend.
 * @header {string} Authorization - Token JWT (Bearer token)
 * @returns {Object} 200 - Datos del usuario autenticado
 * @returns {Error} 401 - Token inválido, expirado o no proporcionado
 * @returns {Error} 403 - Usuario desactivado
 * @security JWT
 */
UserRouter.get(
  "/auth/verify",
  middlewareAuth(null, { required: true }),
  verificarUsers
);

/**
 * @route GET /profile
 * @group Usuarios - Gestión de perfiles
 * @summary Obtener perfil del usuario autenticado
 * @description Retorna la información completa del perfil del usuario actualmente autenticado.
 *              Incluye datos personales, rol, estado y preferencias.
 * @header {string} Authorization - Token JWT (Bearer token)
 * @returns {Object} 200 - Perfil completo del usuario
 * @returns {Error} 401 - Token inválido o no proporcionado
 * @returns {Error} 404 - Usuario no encontrado
 * @security JWT
 */
UserRouter.get(
  "/profile",
  middlewareAuth(null, { required: true }),
  obtenerPerfil
);

/**
 * @route GET /auth/logout
 * @group Autenticación - Gestión de sesiones
 * @summary Cerrar sesión del usuario
 * @description Invalida el token de autenticación actual. En implementaciones con blacklist,
 *              el token se agrega a una lista de tokens invalidados.
 * @header {string} Authorization - Token JWT (Bearer token)
 * @returns {Object} 200 - Confirmación de cierre de sesión
 * @returns {Error} 401 - Token inválido o no proporcionado
 * @security JWT
 */
UserRouter.get(
  "/auth/logout",
  middlewareAuth(null, { required: true }),
  closeSession
);

/**
 * @route POST /auth/recuperar-contrasena
 * @group Autenticación - Recuperación de credenciales
 * @summary Solicitar recuperación de contraseña
 * @description Envía un token de recuperación al email del usuario. 
 *              El token tiene una validez limitada (generalmente 15-60 minutos).
 * @param {Object} req.body - Datos para recuperación
 * @param {string} req.body.email - Email del usuario que solicita recuperación
 * @returns {Object} 200 - Confirmación de envío de token (email enviado)
 * @returns {Error} 400 - Email no registrado o formato inválido
 * @returns {Error} 429 - Demasiadas solicitudes (rate limiting)
 * @returns {Error} 500 - Error al enviar el email
 * @example {json} Request
 * {
 *   "email": "usuario@ejemplo.com"
 * }
 */
UserRouter.post(
  "/auth/recuperar-contrasena",
  middlewareAuth(null, { required: false }),
  EnviarTokenEmail
);

/**
 * @route POST /auth/verificar-token
 * @group Autenticación - Recuperación de credenciales
 * @summary Verificar token de recuperación
 * @description Valida un token de recuperación de contraseña previamente enviado por email.
 *              Si es válido, permite proceder con el cambio de contraseña.
 * @param {Object} req.body - Datos de verificación
 * @param {string} req.body.token - Token de recuperación (6-8 dígitos)
 * @param {string} req.body.email - Email asociado al token
 * @returns {Object} 200 - Token válido, proceder con cambio de contraseña
 * @returns {Error} 400 - Token inválido, expirado o email incorrecto
 * @returns {Error} 404 - Token no encontrado
 * @example {json} Request
 * {
 *   "token": "ABC123",
 *   "email": "usuario@ejemplo.com"
 * }
 */
UserRouter.post(
  "/auth/verificar-token",
  middlewareAuth(null, { required: false }),
  VerificarToken
);

/**
 * @route PUT /auth/cambiar-contrasena
 * @group Autenticación - Gestión de credenciales
 * @summary Cambiar contraseña del usuario
 * @description Permite cambiar la contraseña del usuario. Puede requerir:
 *              1. Token de recuperación (para usuarios que olvidaron contraseña)
 *              2. Token JWT + contraseña actual (para usuarios autenticados)
 * @param {Object} req.body - Datos para cambio de contraseña
 * @param {string} [req.body.currentPassword] - Contraseña actual (requerido si está autenticado)
 * @param {string} req.body.newPassword - Nueva contraseña (mínimo 8 caracteres)
 * @param {string} [req.body.token] - Token de recuperación (alternativo a autenticación)
 * @param {string} [req.body.email] - Email asociado al token
 * @returns {Object} 200 - Contraseña cambiada exitosamente
 * @returns {Error} 400 - Datos inválidos, contraseña débil o token inválido
 * @returns {Error} 401 - No autorizado (contraseña actual incorrecta o token inválido)
 * @returns {Error} 403 - Usuario inactivo
 * @security JWT or RecoveryToken
 * @example {json} Request (autenticado)
 * {
 *   "currentPassword": "vieja123",
 *   "newPassword": "nueva123Segura"
 * }
 * @example {json} Request (recuperación)
 * {
 *   "token": "ABC123",
 *   "email": "usuario@ejemplo.com",
 *   "newPassword": "nueva123Segura"
 * }
 */
UserRouter.put(
  "/auth/cambiar-contrasena",
  middlewareAuth(null, { required: false }),
  cambiarContraseña
);

/**
 * @route DELETE /user/:id_usuario/desactivar
 * @group Administración - Gestión de usuarios
 * @summary Desactivar un usuario
 * @description Cambia el estado de un usuario activo a inactivo (soft delete).
 *              El usuario no podrá iniciar sesión hasta que sea reactivado.
 * @param {string} id_usuario.path.required - ID único del usuario a desactivar
 * @header {string} Authorization - Token JWT con rol SuperAdmin o Vicerrector
 * @returns {Object} 200 - Usuario desactivado exitosamente
 * @returns {Error} 400 - ID de usuario inválido
 * @returns {Error} 401 - No autenticado
 * @returns {Error} 403 - Permisos insuficientes (rol incorrecto)
 * @returns {Error} 404 - Usuario no encontrado
 * @returns {Error} 409 - Usuario ya desactivado
 * @security JWT [SuperAdmin, Vicerrector]
 */
UserRouter.delete(
  "/user/:id_usuario/desactivar",
  middlewareAuth(["SuperAdmin", "Vicerrector"], { required: true }),
  desactivarUsuario
);

/**
 * @route PUT /user/:id_usuario/activar
 * @group Administración - Gestión de usuarios
 * @summary Activar un usuario desactivado
 * @description Reactiva un usuario previamente desactivado, restaurando su acceso al sistema.
 * @param {string} id_usuario.path.required - ID único del usuario a activar
 * @header {string} Authorization - Token JWT con rol SuperAdmin o Vicerrector
 * @returns {Object} 200 - Usuario activado exitosamente
 * @returns {Error} 400 - ID de usuario inválido
 * @returns {Error} 401 - No autenticado
 * @returns {Error} 403 - Permisos insuficientes (rol incorrecto)
 * @returns {Error} 404 - Usuario no encontrado
 * @returns {Error} 409 - Usuario ya activo
 * @security JWT [SuperAdmin, Vicerrector]
 */
UserRouter.put(
  "/user/:id_usuario/activar",
  middlewareAuth(["SuperAdmin", "Vicerrector"], { required: true }),
  activarUsuario
);