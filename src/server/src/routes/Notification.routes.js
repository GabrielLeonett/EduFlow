import { Router } from "express";
import NotificationController from "../controllers/notification.controller.js";
import { middlewareAuth } from "../middlewares/auth.js";

const { mostrarNotificacion } = NotificationController;

export const NotificationRouter = Router();

/**
 * =============================================
 * RUTAS DE NOTIFICACIONES
 * =============================================
 */

/**
 * @name GET /notifications
 * @description Obtener todas las notificaciones del usuario autenticado
 * @query {number} [page=1] - Número de página para paginación
 * @query {number} [limit=20] - Límite de notificaciones por página
 * @query {boolean} [unreadOnly=false] - Solo notificaciones no leídas
 * @middleware Requiere autenticación (cualquier rol)
 * @returns {Array} Lista de notificaciones
 * @example
 * // Obtener notificaciones paginadas
 * curl -X GET 'http://localhost:3000/notifications?page=1&limit=10' \
 *   --header 'Authorization: Bearer <token>'
 *
 * // Obtener solo notificaciones no leídas
 * curl -X GET 'http://localhost:3000/notifications?unreadOnly=true' \
 *   --header 'Authorization: Bearer <token>'
 */
NotificationRouter.get(
  "/notifications",
  middlewareAuth(null),
  mostrarNotificacion
);
