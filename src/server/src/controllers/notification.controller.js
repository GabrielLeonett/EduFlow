import NotificationService from "../services/notification.service.js";
import FormatterResponseController from "../utils/FormatterResponseController.js";

/**
 * @class NotificationController
 * @description Controlador para manejar las operaciones de notificaciones
 */
export default class NotificationController {
  /**
   * @static
   * @async
   * @method mostrarNotificacion
   * @description Obtener notificaciones del usuario actual
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Promise<Object>} Respuesta formateada con las notificaciones
   */
  static async mostrarNotificacion(req, res) {
    try {
      const service = new NotificationService();
      // Validar que el usuario esté autenticado
      if (!req.user || !req.user.id) {
        return FormatterResponseController.respuestaError(
          res,
          "Usuario no autenticado",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      // Validar roles del usuario
      if (!req.user.roles || !Array.isArray(req.user.roles)) {
        return FormatterResponseController.respuestaError(
          res,
          "Información de roles del usuario incompleta",
          400,
          "INVALID_USER_ROLES"
        );
      }

      // Preparar parámetros para el servicio
      const parametros = {
        roles: req.user.roles,
        user_id: req.user.id,
        options: req.query, // Pasar query parameters como opciones
      };

      // Llamar al servicio
      const respuestaServicio = await service.searchNotifications(parametros);

      // Retornar respuesta exitosa
      return FormatterResponseController.respuestaExito(res, {
        data: respuestaServicio,
        message: "Notificaciones obtenidas exitosamente",
        status: 200,
        title: "Notificaciones",
      });
    } catch (error) {
      console.error(
        "Error en NotificationController.mostrarNotificacion:",
        error
      );

      return FormatterResponseController.error(
        res,
        "Error interno del servidor al obtener notificaciones",
        500,
        "INTERNAL_SERVER_ERROR",
        {
          originalError:
            process.env.NODE_ENV === "development" ? error.message : undefined,
          path: "NotificationController.mostrarNotificacion",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method marcarComoLeida
   * @description Marcar una notificación como leída
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Promise<Object>} Respuesta formateada
   */
  static async marcarComoLeida(req, res) {
    try {
      // Validar usuario autenticado
      if (!req.user || !req.user.id) {
        return FormatterResponseController.error(
          res,
          "Usuario no autenticado",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      // Validar ID de notificación
      const { notificacionId } = req.params;
      if (!notificacionId) {
        return FormatterResponseController.error(
          res,
          "ID de notificación requerido",
          400,
          "NOTIFICATION_ID_REQUIRED"
        );
      }

      // Llamar al servicio
      const respuestaServicio = await NotificationService.marcarComoLeida({
        notificacionId,
        usuarioId: req.user.id,
      });

      // Manejar respuesta del servicio
      if (respuestaServicio.success === false) {
        return FormatterResponseController.error(
          res,
          respuestaServicio.error.message ||
            "Error al marcar notificación como leída",
          respuestaServicio.error.status || 500,
          respuestaServicio.error.code || "NOTIFICATION_MARK_READ_ERROR",
          respuestaServicio.error.details
        );
      }

      return FormatterResponseController.success(
        res,
        respuestaServicio.data,
        "Notificación marcada como leída exitosamente",
        {
          status: 200,
          title: "Notificación Actualizada",
        }
      );
    } catch (error) {
      console.error("Error en NotificationController.marcarComoLeida:", error);

      return FormatterResponseController.error(
        res,
        "Error interno del servidor al marcar notificación como leída",
        500,
        "INTERNAL_SERVER_ERROR",
        {
          originalError:
            process.env.NODE_ENV === "development" ? error.message : undefined,
          path: "NotificationController.marcarComoLeida",
        }
      );
    }
  }
}
