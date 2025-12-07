// routes/user.routes.js
import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import UserController from "../controllers/user.controller.js";

/**
 * Router para el módulo de autenticación y gestión de usuarios.
 * Este router maneja todas las rutas relacionadas con autenticación,
 * recuperación de contraseña, gestión de sesiones y administración de usuarios.
 * 
 * @module routes/user.routes
 * @requires express
 * @requires ../middlewares/auth
 * @requires ../controllers/user.controller
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
 *              Genera tokens JWT y los almacena en cookies HTTP-Only seguras.
 * @param {Object} req.body - Datos de autenticación
 * @param {string} req.body.email - Email del usuario
 * @param {string} req.body.password - Contraseña del usuario
 * @returns {Object} 200 - Usuario autenticado exitosamente
 * @returns {Error} 400 - Credenciales faltantes o inválidas
 * @returns {Error} 401 - Credenciales incorrectas
 * @returns {Error} 409 - Sesión activa existente
 * @returns {Error} 500 - Error interno del servidor
 */
UserRouter.post("/auth/login", 
  middlewareAuth([], { required: false }), 
  UserController.login
);

/**
 * @route POST /auth/recuperar-contrasena
 * @group Autenticación - Recuperación de credenciales
 * @summary Solicitar recuperación de contraseña
 * @description Envía un token de recuperación al email del usuario.
 * @param {Object} req.body - Datos para recuperación
 * @param {string} req.body.email - Email del usuario que solicita recuperación
 * @returns {Object} 200 - Confirmación de envío de token
 * @returns {Error} 400 - Email no registrado o formato inválido
 * @returns {Error} 500 - Error al enviar el email
 */
UserRouter.post("/auth/recuperar-contrasena", 
  middlewareAuth(null, { required: false }), 
  UserController.EnviarTokenEmail
);

/**
 * @route POST /auth/verificar-token
 * @group Autenticación - Recuperación de credenciales
 * @summary Verificar token de recuperación
 * @description Valida un token de recuperación de contraseña.
 * @param {Object} req.body - Datos de verificación
 * @param {string} req.body.token - Token de recuperación
 * @param {string} req.body.email - Email asociado al token
 * @returns {Object} 200 - Token válido
 * @returns {Error} 400 - Token inválido, expirado o email incorrecto
 */
UserRouter.post("/auth/verificar-token", 
  middlewareAuth(null, { required: false }), 
  UserController.VerificarToken
);

/**
 * =============================================
 * RUTAS DE AUTENTICACIÓN GENERAL
 * (Requieren token válido)
 * =============================================
 */

/**
 * @route GET /auth/verify
 * @group Autenticación - Operaciones de verificación
 * @summary Verificar sesión de usuario
 * @description Valida la sesión actual y retorna los datos del usuario autenticado.
 * @header {string} Authorization - Token JWT (Bearer token) o cookie
 * @returns {Object} 200 - Datos del usuario autenticado
 * @returns {Error} 401 - Token inválido, expirado o no proporcionado
 */
UserRouter.get("/auth/verify", 
  middlewareAuth(null, { required: true }), 
  UserController.verificarUsers
);

/**
 * @route GET /auth/status
 * @group Autenticación - Estado de autenticación
 * @summary Verificar estado de autenticación
 * @description Retorna información sobre el estado actual de autenticación.
 * @header {string} Authorization - Token JWT (Bearer token) o cookie
 * @returns {Object} 200 - Estado de autenticación
 * @returns {Error} 401 - No autenticado
 */
UserRouter.get("/auth/status", 
  middlewareAuth(null, { required: true }), 
  UserController.checkAuthStatus
);

/**
 * @route POST /auth/refresh
 * @group Autenticación - Renovación de tokens
 * @summary Refrescar token de acceso
 * @description Renueva el token de acceso usando el refresh token almacenado en cookies.
 * @cookie {string} refresh_token - Refresh token HTTP-Only
 * @returns {Object} 200 - Nuevo token de acceso generado
 * @returns {Error} 400 - Refresh token no proporcionado
 * @returns {Error} 401 - Refresh token inválido o expirado
 */
UserRouter.post("/auth/refresh", 
  middlewareAuth(null, { required: false }), 
  UserController.refreshToken
);

/**
 * @route POST /auth/logout
 * @group Autenticación - Gestión de sesiones
 * @summary Cerrar sesión del usuario
 * @description Cierra la sesión actual y limpia todas las cookies de autenticación.
 * @header {string} Authorization - Token JWT (Bearer token) o cookie
 * @returns {Object} 200 - Sesión cerrada exitosamente
 * @returns {Error} 401 - No autenticado
 */
UserRouter.post("/auth/logout", 
  middlewareAuth(null, { required: true }), 
  UserController.closeSession
);

/**
 * =============================================
 * RUTAS DE PERFIL DE USUARIO
 * =============================================
 */

/**
 * @route GET /profile
 * @group Usuarios - Gestión de perfiles
 * @summary Obtener perfil del usuario autenticado
 * @description Retorna la información completa del perfil del usuario actual.
 * @header {string} Authorization - Token JWT (Bearer token) o cookie
 * @returns {Object} 200 - Perfil completo del usuario
 * @returns {Error} 401 - No autenticado
 * @returns {Error} 404 - Usuario no encontrado
 */
UserRouter.get("/profile", 
  middlewareAuth(null, { required: true }), 
  UserController.obtenerPerfil
);

/**
 * @route PUT /auth/cambiar-contrasena
 * @group Autenticación - Gestión de credenciales
 * @summary Cambiar contraseña del usuario
 * @description Permite cambiar la contraseña del usuario autenticado.
 * @header {string} Authorization - Token JWT (Bearer token) o cookie
 * @param {Object} req.body - Datos para cambio de contraseña
 * @param {string} req.body.currentPassword - Contraseña actual
 * @param {string} req.body.newPassword - Nueva contraseña
 * @returns {Object} 200 - Contraseña cambiada exitosamente
 * @returns {Error} 400 - Datos inválidos o contraseña débil
 * @returns {Error} 401 - Contraseña actual incorrecta o no autenticado
 */
UserRouter.put("/auth/cambiar-contrasena", 
  middlewareAuth(null, { required: true }), 
  UserController.cambiarContraseña
);

/**
 * =============================================
 * RUTAS DE ADMINISTRACIÓN DE USUARIOS
 * (Requieren roles específicos)
 * =============================================
 */

/**
 * @route DELETE /user/:id_usuario/desactivar
 * @group Administración - Gestión de usuarios
 * @summary Desactivar un usuario
 * @description Cambia el estado de un usuario activo a inactivo (soft delete).
 * @param {string} id_usuario.path.required - ID del usuario a desactivar
 * @header {string} Authorization - Token JWT con rol autorizado
 * @returns {Object} 200 - Usuario desactivado exitosamente
 * @returns {Error} 400 - ID de usuario inválido
 * @returns {Error} 401 - No autenticado
 * @returns {Error} 403 - Permisos insuficientes
 * @returns {Error} 404 - Usuario no encontrado
 * @security JWT [SuperAdmin, Vicerrector]
 */
UserRouter.delete("/user/:id_usuario/desactivar", 
  middlewareAuth(["SuperAdmin", "Vicerrector"], { required: true }), 
  UserController.desactivarUsuario
);

/**
 * @route PUT /user/:id_usuario/activar
 * @group Administración - Gestión de usuarios
 * @summary Activar un usuario desactivado
 * @description Reactiva un usuario previamente desactivado.
 * @param {string} id_usuario.path.required - ID del usuario a activar
 * @header {string} Authorization - Token JWT con rol autorizado
 * @returns {Object} 200 - Usuario activado exitosamente
 * @returns {Error} 400 - ID de usuario inválido
 * @returns {Error} 401 - No autenticado
 * @returns {Error} 403 - Permisos insuficientes
 * @returns {Error} 404 - Usuario no encontrado
 * @security JWT [SuperAdmin, Vicerrector]
 */
UserRouter.put("/user/:id_usuario/activar", 
  middlewareAuth(["SuperAdmin", "Vicerrector"], { required: true }), 
  UserController.activarUsuario
);

/**
 * =============================================
 * RUTAS ADICIONALES PARA COMPATIBILIDAD
 * =============================================
 */

/**
 * @route GET /auth/logout
 * @deprecated Usar POST /auth/logout en su lugar
 * @group Autenticación - Gestión de sesiones
 * @summary Cerrar sesión (método GET - legacy)
 * @description Versión anterior para cerrar sesión. Mantenida por compatibilidad.
 */
UserRouter.get("/auth/logout", 
  middlewareAuth(null, { required: true }), 
  UserController.closeSession
);

export default UserRouter;