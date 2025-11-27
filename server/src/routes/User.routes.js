import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import UserController from "../controllers/user.controller.js";

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

export const UserRouter = Router();

/**
 * =============================================
 * RUTAS PÚBLICAS (Sin autenticación)
 * =============================================
 */

/**
 * @name POST /auth/login
 * @description Iniciar sesión de usuario
 * @body {Object} Credenciales de acceso
 * @body {string} body.email - Correo electrónico
 * @body {string} body.password - Contraseña
 */
UserRouter.post("/auth/login", middlewareAuth([], { required: false }), login);

/**
 * =============================================
 * RUTAS DE AUTENTICACIÓN
 * =============================================
 */

/**
 * @name GET /auth/verify
 * @description Verificar token de autenticación y obtener datos del usuario
 * @middleware Requiere autenticación (cualquier rol)
 */
UserRouter.get(
  "/auth/verify",
  middlewareAuth(null, { required: true }),
  verificarUsers
);

/**
 * @name GET /profile
 * @description Verificar token de autenticación y obtener datos del usuario
 * @middleware Requiere autenticación (cualquier rol)
 */
UserRouter.get(
  "/profile",
  middlewareAuth(null, { required: true }),
  obtenerPerfil
);

/**
 * @name get /auth/logout
 * @description Cerrar sesión del usuario
 * @middleware Requiere autenticación (cualquier rol)
 */
UserRouter.get(
  "/auth/logout",
  middlewareAuth(null, { required: true }),
  closeSession
);

/**
 * @name post /auth/logout
 * @description Cerrar sesión del usuario
 * @middleware Requiere autenticación (cualquier rol)
 */
UserRouter.post(
  "/auth/recuperar-contrasena",
  middlewareAuth(null, { required: false }),
  EnviarTokenEmail
);
/**
 * @name post /auth/logout
 * @description Cerrar sesión del usuario
 * @middleware Requiere autenticación (cualquier rol)
 */
UserRouter.post(
  "/auth/verificar-token",
  middlewareAuth(null, { required: false }),
  VerificarToken
);

/**
 * @name PUT /auth/password
 * @description Cambiar contraseña del usuario autenticado
 * @middleware Requiere que el usuario haya iniciado sesion
 */
UserRouter.put(
  "/auth/cambiar-contrasena",
  middlewareAuth(null, { required: false }),
  cambiarContraseña
);

/**
 * @name DELETE /user/:id_usuario/desactivar
 * @description Desactivar un usuario específico
 * @middleware Requiere permisos de SuperAdmin o Vicerrector
 */
UserRouter.delete(
  "/user/:id_usuario/desactivar",
  middlewareAuth(["SuperAdmin", "Vicerrector"], { required: true }),
  desactivarUsuario
);

/**
 * @name PUT /user/:id_usuario/activar
 * @description Activar un usuario previamente desactivado
 * @middleware Requiere permisos de SuperAdmin o Vicerrector
 */
UserRouter.put(
  "/user/:id_usuario/activar",
  middlewareAuth(["SuperAdmin", "Vicerrector"], { required: true }),
  activarUsuario
);
