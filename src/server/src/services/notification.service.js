import db from "../database/db.js";
import SocketServices from "./socket.service.js";

export default class NotificationService {
  constructor() {
    this.socketService = SocketServices.getInstance();
    this.socketService.initializeService();
    this.io = this.socketService.io;
  }

  /**
   * @name searchNotificationUser
   * @description Busca las notificaciones vinculadas con el usuario
   * @param {Number} user_id Id del usuario
   * @returns {Array} Notificaciones que están vinculadas con el usuario
   */
  async searchNotificationUser(user_id, options = {}) {
    try {
      const { soloNoLeidas = true, limite = 50 } = options;

      let query = db('public.vista_notificaciones_completa')
        .where('user_id', parseInt(user_id));

      if (soloNoLeidas) {
        query = query.where('leida', false);
      }

      const result = await query
        .orderBy('fecha_creacion', 'desc')
        .limit(limite);

      return result;
    } catch (error) {
      console.error("❌ Error en searchNotificationUser:", error);
      throw error;
    }
  }

  /**
   * Busca notificaciones masivas dirigidas a roles específicos
   */
  async searchNotificationRoles(roles, options = {}) {
    try {
      if (!roles || roles.length === 0) {
        return [];
      }

      const { soloNoLeidas = true, limite = 50 } = options;

      // Usar whereRaw para el operador && de PostgreSQL
      let query = db('public.vista_notificaciones_completa')
        .where('es_masiva', true)
        .whereRaw('roles_destinatarios && ?', [roles]);

      if (soloNoLeidas) {
        query = query.where('leida', false);
      }

      const result = await query
        .orderBy('fecha_creacion', 'desc')
        .limit(limite);

      return result;
    } catch (error) {
      console.error("❌ Error en searchNotificationRoles:", error);
      throw error;
    }
  }

  /**
   * Busca notificaciones masivas donde el usuario específico sea destinatario directo
   */
  async searchNotificationDestinatario(user_id, options = {}) {
    try {
      const { soloNoLeidas = true, limite = 50 } = options;

      // Usar whereRaw para el operador ANY de PostgreSQL
      let query = db('public.vista_notificaciones_completa')
        .where('es_masiva', true)
        .whereRaw('? = ANY(usuarios_destinatarios)', [parseInt(user_id)]);

      if (soloNoLeidas) {
        query = query.where('leida', false);
      }

      const result = await query
        .orderBy('fecha_creacion', 'desc')
        .limit(limite);

      return result;
    } catch (error) {
      console.error("❌ Error en searchNotificationDestinatario:", error);
      throw error;
    }
  }

  /**
   * Busca notificaciones globales
   */
  async searchNotificationGlobales(options = {}) {
    try {
      const { soloNoLeidas = true, limite = 50 } = options;

      let query = db('public.vista_notificaciones_completa')
        .where('es_masiva', true)
        .where(function() {
          // Notificaciones realmente globales (sin destinatarios)
          this.where(function() {
            this.whereNull('roles_destinatarios')
              .orWhere('roles_destinatarios', '{}')
              .orWhereRaw('array_length(roles_destinatarios, 1) IS NULL');
          })
          .andWhere(function() {
            this.whereNull('usuarios_destinatarios')
              .orWhere('usuarios_destinatarios', '{}')
              .orWhereRaw('array_length(usuarios_destinatarios, 1) IS NULL');
          })
          // Incluir notificaciones con roles (pero sin usuarios específicos)
          .orWhere(function() {
            this.whereRaw('array_length(roles_destinatarios, 1) > 0')
              .andWhere(function() {
                this.whereNull('usuarios_destinatarios')
                  .orWhere('usuarios_destinatarios', '{}')
                  .orWhereRaw('array_length(usuarios_destinatarios, 1) IS NULL');
              });
          });
        });

      if (soloNoLeidas) {
        query = query.where('leida', false);
      }

      const result = await query
        .orderBy('fecha_creacion', 'desc')
        .limit(limite);

      return result;
    } catch (error) {
      console.error("❌ Error en searchNotificationGlobales:", error);
      throw error;
    }
  }

  /**
   * Busca todas las notificaciones relevantes para un usuario
   */
  async searchNotifications({ roles = [], user_id = null, options = {} }) {
    try {
      const [
        notificationsUser,
        notificationsRol,
        notificationsDestinatario,
        notificationsGlobales,
      ] = await Promise.all([
        user_id ? this.searchNotificationUser(user_id, options) : [],
        roles.length > 0 ? this.searchNotificationRoles(roles, options) : [],
        user_id ? this.searchNotificationDestinatario(user_id, options) : [],
        this.searchNotificationGlobales(options),
      ]);

      // Combinar y eliminar duplicados
      const allNotificationsMap = new Map();

      [
        ...notificationsUser,
        ...notificationsRol,
        ...notificationsDestinatario,
        ...notificationsGlobales,
      ].forEach((notif) => {
        if (!allNotificationsMap.has(notif.id)) {
          allNotificationsMap.set(notif.id, notif);
        }
      });

      const allNotifications = Array.from(allNotificationsMap.values());

      return allNotifications.sort(
        (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      );
    } catch (error) {
      console.error("❌ Error en searchNotifications:", error);
      throw error;
    }
  }

  /**
   * Escucha notificaciones en tiempo real
   */
  async listenNotifications(timeoutMs = 30000) {
    // Para LISTEN/NOTIFY de PostgreSQL, necesitas raw queries
    return new Promise(async (resolve, reject) => {
      try {
        // Usar raw query para LISTEN
        await db.raw("LISTEN nueva_notificacion");
        await db.raw("LISTEN notificacion_actualizada");

        // Necesitarías un cliente pg específico para notifications
        // Esto requiere una configuración especial
        
        // Timeout
        setTimeout(() => {
          resolve(null);
        }, timeoutMs);
      } catch (error) {
        console.error("❌ Error en listenNotifications:", error);
        reject(error);
      }
    });
  }

  /**
   * Envía notificación a usuario específico
   */
  async sendToUser(userId) {
    try {
      const notifications = await this.searchNotificationUser(userId);
      const notificationsDest = await this.searchNotificationDestinatario(userId);
      const allNotifications = [...notifications, ...notificationsDest];

      this.io.to(`user_${userId}`).emit("new_notification", allNotifications);
      console.log(`📨 Notificación enviada a usuario ${userId}`);
    } catch (error) {
      console.error("❌ Error enviando notificación a usuario:", error);
    }
  }

  /**
   * Envía notificación a roles
   */
  async sendToRoles(roles) {
    try {
      const notifications = await this.searchNotificationRoles(roles);

      roles.forEach((role) => {
        const roomName = `role_${role.toLowerCase()}`;
        this.io.to(roomName).emit("new_notification", {
          success: true,
          data: notifications,
          timestamp: new Date().toISOString(),
        });
      });

      console.log(`✅ Notificación enviada a roles: ${roles.join(", ")}`);
    } catch (error) {
      console.error("❌ Error enviando notificación a roles:", error);
    }
  }

  /**
   * Envía notificaciones globales
   */
  async sendToGlobals() {
    try {
      const globalNotifications = await this.searchNotificationGlobales();

      globalNotifications.forEach((notification) => {
        this.io.emit("new_notification", {
          data: notification,
        });
      });
    } catch (error) {
      console.error("❌ Error enviando notificaciones globales:", error);
      throw error;
    }
  }

  /**
   * Marca notificación como leída
   */
  async markAsRead(notificationId, userId) {
    try {
      // Usar raw para la función específica de PostgreSQL
      const result = await db.raw(`
        UPDATE public.notification_recipients
        SET is_read = TRUE, read_at = NOW()
        WHERE notification_id = ? AND user_id = ?
        RETURNING *
      `, [notificationId, userId]);

      if (result.rows.length > 0) {
        const updatedRecipientStatus = result.rows[0];

        this.io.to(`user:${userId}`).emit("notification_updated", {
          notificationId: updatedRecipientStatus.notification_id,
          userId: updatedRecipientStatus.user_id,
          is_read: true,
          read_at: updatedRecipientStatus.read_at,
          action: "marked_read",
        });

        return updatedRecipientStatus;
      } else {
        throw new Error(
          `Estado de Notificación ID ${notificationId} no encontrado para el Usuario ID ${userId}.`
        );
      }
    } catch (error) {
      console.error("Error en markAsRead:", error);
      throw error;
    }
  }

  /**
   * Crea una notificación individual
   */
  async crearNotificacionIndividual({
    titulo,
    tipo,
    user_id,
    contenido = null,
    metadatos = null,
  }) {
    try {
      // Usar raw para la función PostgreSQL
      const result = await db.raw(
        `SELECT utils.registrar_notificacion(?, ?, ?, ?, ?, ?, ?) as notification_id`,
        [titulo, tipo, user_id, contenido, false, null, metadatos]
      );

      const notificationId = result.rows[0].notification_id;

      // Obtener datos completos con Knex
      const notificacion = await db('vista_notificaciones_completa')
        .where('id', notificationId)
        .first();

      if (this.io) {
        this.io.to(`user_${user_id}`).emit("new_notification", {
          success: true,
          data: [notificacion],
          timestamp: new Date().toISOString(),
        });
        console.log(
          `📨 Notificación individual enviada en tiempo real a usuario ${user_id}`
        );
      }

      return notificacion;
    } catch (error) {
      console.error("❌ Error creando notificación individual:", error);
      throw error;
    }
  }

  /**
   * Crea una notificación masiva
   */
  async crearNotificacionMasiva({
    titulo,
    tipo,
    contenido = null,
    metadatos = null,
    roles_ids = [],
    users_ids = [],
  }) {
    try {
      // Usar raw para la función PostgreSQL
      const result = await db.raw(
        `SELECT utils.registrar_notificacion_masiva(?, ?, ?, ?, ?, ?) as notification_id`,
        [tipo, titulo, contenido, metadatos, roles_ids, users_ids]
      );

      const notificationId = result.rows[0].notification_id;

      // Obtener datos completos con Knex
      const notificacion = await db('vista_notificaciones_completa')
        .where('id', notificationId)
        .first();

      // Enviar en tiempo real
      if (this.io) {
        if (notificacion.roles_destinatarios?.length > 0) {
          notificacion.roles_destinatarios.forEach((role) => {
            this.io.to(`role_${role.toLowerCase()}`).emit("new_notification", {
              success: true,
              data: [notificacion],
              timestamp: new Date().toISOString(),
            });
          });
          console.log(
            `📨 Notificación masiva enviada a roles:`,
            notificacion.roles_destinatarios
          );
        }

        if (notificacion.usuarios_destinatarios?.length > 0) {
          notificacion.usuarios_destinatarios.forEach((userId) => {
            this.io.to(`user_${userId}`).emit("new_notification", {
              success: true,
              data: [notificacion],
              timestamp: new Date().toISOString(),
            });
          });
          console.log(
            `📨 Notificación masiva enviada a usuarios:`,
            notificacion.usuarios_destinatarios
          );
        }
      }

      return notificacion;
    } catch (error) {
      console.error("❌ Error creando notificación masiva:", error);
      throw error;
    }
  }

  /**
   * Agrega un rol destinatario
   */
  async agregarRolDestinatario(notification_id, role_id) {
    try {
      // Usar raw para la función PostgreSQL
      await db.raw(
        `SELECT utils.registrar_rol_notificacion(?, ?)`,
        [notification_id, role_id]
      );

      // Obtener notificación actualizada
      const notificacion = await db('vista_notificaciones_completa')
        .where('id', notification_id)
        .first();

      // Enviar en tiempo real
      if (this.io) {
        const roleResult = await db.raw(
          `SELECT nombre_rol FROM roles WHERE id_rol = ?`,
          [role_id]
        );

        if (roleResult.rows.length > 0) {
          const roleName = roleResult.rows[0].nombre_rol;
          this.io
            .to(`role_${roleName.toLowerCase()}`)
            .emit("new_notification", {
              success: true,
              data: [notificacion],
              timestamp: new Date().toISOString(),
            });
          console.log(`📨 Notificación enviada a nuevo rol: ${roleName}`);
        }
      }

      return notificacion;
    } catch (error) {
      console.error("❌ Error agregando rol destinatario:", error);
      throw error;
    }
  }

  /**
   * Agrega un usuario destinatario
   */
  async agregarUsuarioDestinatario(notification_id, user_id, is_read = false) {
    try {
      // Usar raw para la función PostgreSQL
      await db.raw(
        `SELECT utils.registrar_destinatario_notificacion(?, ?, ?)`,
        [notification_id, user_id, is_read]
      );

      // Obtener notificación actualizada
      const notificacion = await db('vista_notificaciones_completa')
        .where('id', notification_id)
        .first();

      // Enviar en tiempo real
      if (this.io) {
        this.io.to(`user_${user_id}`).emit("new_notification", {
          success: true,
          data: [notificacion],
          timestamp: new Date().toISOString(),
        });
        console.log(`📨 Notificación enviada a nuevo usuario: ${user_id}`);
      }

      return notificacion;
    } catch (error) {
      console.error("❌ Error agregando usuario destinatario:", error);
      throw error;
    }
  }

  /**
   * Método completo para crear notificación
   */
  async crearNotificacionCompleta({
    titulo,
    tipo,
    contenido = null,
    metadatos = null,
    user_id = null,
    roles_ids = [],
    users_ids = [],
    es_masiva = false,
  }) {
    if (es_masiva) {
      return await this.crearNotificacionMasiva({
        titulo,
        tipo,
        contenido,
        metadatos,
        roles_ids,
        users_ids,
      });
    } else {
      if (!user_id) {
        throw new Error("Para notificación individual se requiere user_id");
      }
      return await this.crearNotificacionIndividual({
        titulo,
        tipo,
        user_id,
        contenido,
        metadatos,
      });
    }
  }
}