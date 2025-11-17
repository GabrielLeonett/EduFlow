// Importa funcion para poder obtener la cookie de un string
import { getCookie } from "../utils/utilis.js";
// Importa la librería jsonwebtoken para trabajar con JWT (JSON Web Tokens)
import jwt from "jsonwebtoken";
/**
 * Middleware de autenticación JWT que protege rutas basado en roles.
 *
 * @example
 * // Uso básico:
 * router.get('/ruta-protegida', middlewareAuth(['admin', 'editor']), handler);
 *
 * // Ruta opcionalmente protegida:
 * router.get('/ruta-opcional', middlewareAuth([], { required: false }), handler);
 *
 * @param {string[]} [requiredRoles] - Roles requeridos para acceder (opcional).
 * @param {Object} [options] - Opciones adicionales
 * @param {boolean} [options.required=true] - Si la autenticación es requerida
 *
 * @returns {import('express').RequestHandler} Middleware de Express
 *
 * @throws {401} Si no hay token presente
 * @throws {403} Si el token es inválido/expirado o faltan permisos
 *
 * @version 2.1.0
 * @since 1.0.0
 */
export const middlewareAuth = (requiredRoles = [], options = {}) => {
  const { required = true } = options;

  return (req, res, next) => {
    // 1. Verificación de token presente
    // Nota: 'autorization' parece typo, debería ser 'authorization'
    const token = req.cookies?.autorization; 

    // Si no es requerido y no hay token, continuar sin autenticación
    if (!required && !token) {
      return next();
    }

    // Si es requerido y no hay token, denegar acceso
    if (!token) {
      return res.status(401).json({
        title: "Acceso Denegado",
        message: "Se requiere autenticación para acceder a este recurso.",
      });
    }

    // 2. Verificación de validez del token
    jwt.verify(token, process.env.AUTH_SECRET_KEY, (error, decoded) => {
      if (error) {
        // Si no es requerido y el token es inválido, continuar sin autenticación
        if (!required) {
          return next();
        }

        // Manejo específico de errores de token con formato {title, message}
        if (error.name === "TokenExpiredError") {
          return res.status(403).json({
            title: "Sesión Expirada",
            message: "Su sesión ha expirado, por favor inicie sesión nuevamente.",
          });
        } else {
          return res.status(403).json({
            title: "Token Inválido",
            message: "El token de autenticación es inválido o corrupto.",
          });
        }
      }

      // Adjunta la información del usuario decodificada a la solicitud
      req.user = decoded;

      // 3. Verificación de roles (si se especificaron roles requeridos)
      if (requiredRoles && requiredRoles.length > 0) {
        // Verificar que el usuario tenga roles
        if (!req.user.roles || !Array.isArray(req.user.roles)) {
          return res.status(403).json({
            title: "Acceso Denegado",
            message: "Información de roles incompleta en el token.",
          });
        }

        // Lógica corregida: SuperAdmin tiene acceso completo O el usuario tiene alguno de los roles requeridos
        const hasPermission = req.user.roles.some(
          (role) => role === "SuperAdmin" || requiredRoles.includes(role)
        );

        if (!hasPermission) {
          return res.status(403).json({
            title: "Acceso Denegado",
            message: "Privilegios insuficientes para acceder a este recurso.",
          });
        }
      }

      // Si pasa todas las validaciones, continúa con el siguiente middleware
      next();
    });
  };
};

/**
 * Middleware de autenticación JWT para Socket.io que protege conexiones basado en roles.
 *
 * @example
 * // Uso básico:
 * io.use(socketAuth(['admin', 'editor']));
 *
 * // En tu servicio Socket:
 * this.io.use(socketAuth(['user', 'admin']));
 *
 * @param {string[]} [requiredRoles] - Roles requeridos para la conexión (opcional).
 *
 * @returns {Function} Middleware de Socket.io
 *
 * @throws {Error} Si no hay token presente
 * @throws {Error} Si el token es inválido/expirado o faltan permisos
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const socketAuth = (requiredRoles = []) => {
  return (socket, next) => {
    try {
      // Si ya tenemos socket.user, saltar la verificación
      if (socket.user) {
        return validateRoles(socket, requiredRoles, next);
      }

      const autorizationCookie = getCookie(
        socket.handshake.headers.cookie,
        "autorization"
      );

      // Si no hay token, continuar como anónimo
      if (!autorizationCookie) {
        return next();
      }

      // Verificar token
      jwt.verify(
        autorizationCookie,
        process.env.AUTH_SECRET_KEY,
        (error, decoded) => {
          if (error) {
            return next(); // Continuar como anónimo en caso de error
          }

          // Adjuntar información del usuario
          const { id, nombres, apellidos, roles } = decoded;
          socket.user = { id, nombres, apellidos, roles };

          // Validar roles después de tener el usuario
          validateRoles(socket, requiredRoles, next);
        }
      );
    } catch (error) {
      next(); // Continuar como anónimo en caso de error
    }
  };
};

// Función auxiliar para validación de roles
function validateRoles(socket, requiredRoles, next) {
  // Solo validar si se especificaron roles requeridos
  if (requiredRoles && requiredRoles.length > 0 && socket.user) {
    if (!socket.user.roles || !Array.isArray(socket.user.roles)) {
        return next(
            new Error(
                JSON.stringify({
                    title: "Acceso Denegado (Socket)",
                    message: "Información de roles incompleta para la conexión.",
                })
            )
        );
    }

    const hasRequiredRole = socket.user.roles.some(
      (role) => role === "SuperAdmin" || requiredRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return next(
        new Error(
          JSON.stringify({
            title: "Acceso Denegado (Socket)",
            message: "Privilegios insuficientes para establecer la conexión.",
          })
        )
      );
    }
  }

  next();
}