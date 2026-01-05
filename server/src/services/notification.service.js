import pool from "../database/pg.js";
import SocketServices from "./socket.service.js";

export default class NotificationService {
  constructor() {
    this.socketService = SocketServices.getInstance();
    this.socketService.initializeService(); // Asegurar que esté inicializado
    this.io = this.socketService.io; // 🔥 OBTENER IO
    this.pool = pool;
  }

  /**
   * @name connectDB
   * @method
   * @description Metodo para conectarme a la base de datos en la misma instancia
   * @returns
   * Devuelve la conexion con la base de datos
   */
  async connectDB() {
    if (!this.pool) {
      this.pool = pool;
      await this.pool.connect();
    }
    return this.pool;
  }

  /**
   * @name disconnectDB
   * @method
   * @description Metodo que ejecuta las desconexion de la base de datos
   */
  async disconnectDB() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * @name searchNotificationUser
   * @description Busca las notificiones vinculadas con el usuario
   * @param {Number} user_id Id del usuario
   * @returns
   * Notificaciones que estan vinculadas con el usuario
   */
  async searchNotificationUser(user_id, options = {}) {
    try {
      const { soloNoLeidas = true, limite = 50 } = options; // ❌ Eliminar fechaDesde

      let query = `
      SELECT * FROM public.vista_notificaciones_completa 
      WHERE user_id = $1::bigint
    `;

      const params = [parseInt(user_id)];
      let paramCount = 1;

      // Filtro por no leídas
      if (soloNoLeidas) {
        paramCount++;
        query += ` AND leida = $${paramCount}::boolean`;
        params.push(false);
      }

      // ❌ ELIMINADO: filtro por fechaDesde
      // if (fechaDesde) {
      //   paramCount++;
      //   query += ` AND fecha_creacion > $${paramCount}::timestamp`;
      //   params.push(fechaDesde);
      // }

      // Orden y límite
      paramCount++;
      query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount}::integer`;
      params.push(limite);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("❌ Error en searchNotificationUser:", error);
      throw error;
    }
  }

  /**
   * Busca notificaciones masivas dirigidas a roles específicos en el sistema.
   *
   * @async
   * @method searchNotificationRoles
   * @param {string[]} roles - Array de roles para filtrar las notificaciones masivas
   * @returns {Promise<Array<Object>>} Promesa que resuelve con un array de objetos de notificación
   * @throws {Error} Cuando ocurre un error en la consulta a la base de datos
   *
   * @example
   * // Buscar notificaciones para roles de profesor y administrador
   * const notificaciones = await notificationService.searchNotificationRoles(['profesor', 'admin']);
   *
   * @example
   * // Si no se proporcionan roles, retorna array vacío
   * const notificaciones = await notificationService.searchNotificationRoles([]);
   * // Retorna: []
   *
   * @description
   * Consulta la vista 'vista_notificaciones_completa' para obtener notificaciones masivas
   * que estén dirigidas a cualquiera de los roles especificados. Utiliza el operador && de PostgreSQL
   * para verificar la intersección entre arrays.
   */
  async searchNotificationRoles(roles, options = {}) {
    try {
      if (!roles || roles.length === 0) {
        return [];
      }

      const { soloNoLeidas = true, limite = 50 } = options; // ❌ Eliminar fechaDesde

      let query = `
      SELECT * FROM public.vista_notificaciones_completa 
      WHERE es_masiva = true 
      AND roles_destinatarios && $1::varchar[]
    `;

      const params = [roles];
      let paramCount = 1;

      if (soloNoLeidas) {
        paramCount++;
        query += ` AND leida = $${paramCount}::boolean`;
        params.push(false);
      }

      // ❌ ELIMINADO: filtro por fechaDesde
      // if (fechaDesde) {
      //   paramCount++;
      //   query += ` AND fecha_creacion > $${paramCount}::timestamp`;
      //   params.push(fechaDesde);
      // }

      paramCount++;
      query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount}::integer`;
      params.push(limite);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("❌ Error en searchNotificationRoles:", error);
      throw error;
    }
  }

  /**
   * Busca notificaciones masivas donde el usuario específico sea destinatario directo.
   *
   * @async
   * @method searchNotificationDestinatario
   * @param {string|number} user_id - ID del usuario para filtrar notificaciones
   * @returns {Promise<Array<Object>>} Promesa que resuelve con un array de objetos de notificación
   * @throws {Error} Cuando ocurre un error en la consulta a la base de datos
   *
   * @example
   * // Buscar notificaciones para el usuario con ID 31264460
   * const notificaciones = await notificationService.searchNotificationDestinatario(31264460);
   *
   * @example
   * // Buscar notificaciones para usuario string ID
   * const notificaciones = await notificationService.searchNotificationDestinatario('user_123');
   *
   * @description
   * Consulta la vista 'vista_notificaciones_completa' para obtener notificaciones masivas
   * donde el usuario específico esté incluido en la lista de usuarios destinatarios.
   * Utiliza el operador ANY de PostgreSQL para verificar si el user_id está en el array de destinatarios.
   */
  async searchNotificationDestinatario(user_id, options = {}) {
    try {
      const { soloNoLeidas = true, limite = 50 } = options; // ❌ Eliminar fechaDesde

      let query = `
      SELECT * FROM public.vista_notificaciones_completa 
      WHERE es_masiva = true 
      AND $1::bigint = ANY(usuarios_destinatarios)
    `;

      const params = [parseInt(user_id)]; // Usar parseInt en lugar de toString()
      let paramCount = 1;

      if (soloNoLeidas) {
        paramCount++;
        query += ` AND leida = $${paramCount}::boolean`;
        params.push(false);
      }

      // ❌ ELIMINADO: filtro por fechaDesde
      // if (fechaDesde) {
      //   paramCount++;
      //   query += ` AND fecha_creacion > $${paramCount}::timestamp`;
      //   params.push(fechaDesde);
      // }

      paramCount++;
      query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount}::integer`;
      params.push(limite);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("❌ Error en searchNotificationDestinatario:", error);
      throw error;
    }
  }

  /**
   * Busca notificaciones globales (públicas) que no están dirigidas a usuarios o roles específicos.
   *
   * @async
   * @method searchNotificationGlobales
   * @returns {Promise<Array<Object>>} Promesa que resuelve con un array de notificaciones globales
   * @throws {Error} Cuando ocurre un error en la consulta a la base de datos
   *
   * @example
   * // Buscar todas las notificaciones globales
   * const notificacionesGlobales = await notificationService.searchNotificationGlobales();
   *
   * @description
   * Consulta la vista 'vista_notificaciones_completa' para obtener notificaciones masivas
   * que sean completamente globales, es decir:
   * - No tienen user_id asociado (user_id IS NULL)
   * - No tienen roles destinatarios definidos (roles_destinatarios = array vacío)
   * - No tienen usuarios destinatarios específicos (usuarios_destinatarios = array vacío)
   *
   * Estas notificaciones son visibles para todos los usuarios del sistema.
   */
  async searchNotificationGlobales(options = {}) {
    try {
      const { soloNoLeidas = true, limite = 50 } = options;

      let query = `
      SELECT * FROM public.vista_notificaciones_completa 
      WHERE es_masiva = true 
      AND (
        -- Notificaciones realmente globales (sin destinatarios)
        (
          (roles_destinatarios IS NULL OR roles_destinatarios = '{}' OR array_length(roles_destinatarios, 1) IS NULL)
          AND
          (usuarios_destinatarios IS NULL OR usuarios_destinatarios = '{}' OR array_length(usuarios_destinatarios, 1) IS NULL)
        )
        OR
        -- 🔥 INCLUIR notificaciones con roles (pero sin usuarios específicos)
        (
          array_length(roles_destinatarios, 1) > 0 
          AND 
          (usuarios_destinatarios IS NULL OR usuarios_destinatarios = '{}' OR array_length(usuarios_destinatarios, 1) IS NULL)
        )
      )
    `;

      const params = [];
      let paramCount = 0;

      if (soloNoLeidas) {
        paramCount++;
        query += ` AND leida = $${paramCount}::boolean`;
        params.push(false);
      }

      paramCount++;
      query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount}::integer`;
      params.push(limite);

      //console.log("🔍 Query globales EXPANDIDA:", query);
      //console.log("🔍 Parámetros:", params);

      const result = await this.pool.query(query, params);
      //console.log(`✅ Notificaciones globales expandidas encontradas: ${result.rows.length}`);

      return result.rows;
    } catch (error) {
      //console.error("❌ Error en searchNotificationGlobales:", error);
      throw error;
    }
  }

  /**
   * Busca todas las notificaciones relevantes para un usuario específico basándose en sus roles y ID.
   * Combina múltiples fuentes de notificaciones y elimina duplicados.
   *
   * @async
   * @method searchNotifications
   * @param {Object} params - Parámetros de búsqueda
   * @param {string[]} [params.roles=[]] - Roles del usuario para filtrar notificaciones por rol
   * @param {string|number} [params.user_id=null] - ID del usuario para filtrar notificaciones personales
   * @returns {Promise<Array<Object>>} Promesa que resuelve con un array combinado y único de notificaciones
   * @throws {Error} Cuando ocurre un error en alguna de las consultas a la base de datos
   *
   * @example
   * // Buscar notificaciones para un profesor con ID específico
   * const notificaciones = await notificationService.searchNotifications({
   *   roles: ['profesor', 'coordinador'],
   *   user_id: 31264460
   * });
   *
   * @example
   * // Buscar notificaciones solo con roles (sin user_id)
   * const notificaciones = await notificationService.searchNotifications({
   *   roles: ['admin']
   * });
   *
   * @description
   * Este método realiza búsquedas en paralelo de 4 tipos de notificaciones:
   * 1. Notificaciones personales del usuario (searchNotificationUser)
   * 2. Notificaciones por roles del usuario (searchNotificationRoles)
   * 3. Notificaciones donde el usuario es destinatario directo (searchNotificationDestinatario)
   * 4. Notificaciones globales para todos los usuarios (searchNotificationGlobales)
   *
   * Luego combina los resultados y elimina duplicados usando un Map basado en el ID de notificación.
   * Esto garantiza que cada notificación aparezca solo una vez en el resultado final.
   */
  async searchNotifications({ roles = [], user_id = null, options = {} }) {
    try {
      await this.connectDB();

      // En searchNotifications, antes de las consultas
      //console.log("🔍 Debug - usuario y roles:", {user_id,user_roles: roles});
      //console.log("⚙ opciones: ", options);

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

      // Ordenar por fecha de creación (más recientes primero)
      return allNotifications.sort(
        (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      );
    } catch (error) {
      //console.error("❌ Error en searchNotifications:", error);
      throw error;
    }
  }

  /**
   * Escucha notificaciones en tiempo real desde PostgreSQL usando LISTEN/NOTIFY.
   * Espera por nuevas notificaciones en los canales especificados hasta que ocurra un timeout.
   *
   * @async
   * @method listenNotifications
   * @param {number} [timeoutMs=30000] - Tiempo máximo de espera en milisegundos (30 segundos por defecto)
   * @returns {Promise<Object|null>} Promesa que resuelve con los datos de la notificación o null si timeout
   * @throws {Error} Cuando ocurre un error en la conexión o parsing de datos
   *
   * @example
   * // Escuchar notificaciones por 30 segundos
   * const notificacion = await notificationService.listenNotifications();
   *
   * @example
   * // Escuchar notificaciones por 60 segundos
   * const notificacion = await notificationService.listenNotifications(60000);
   *
   * @description
   * Este método utiliza el sistema de LISTEN/NOTIFY de PostgreSQL para recibir notificaciones
   * en tiempo real. Se suscribe a dos canales:
   * - 'nueva_notificacion': Para notificaciones normales
   * - 'notificacion_inmediata': Para notificaciones urgentes
   *
   * Cuando llega una notificación, se procesa y automáticamente limpia los listeners y cierra la conexión.
   */
  async listenNotifications(timeoutMs = 30000) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.pool.connect();

        const notificationHandler = (msg) => {
          if (
            msg.channel === "nueva_notificacion" ||
            msg.channel === "notificacion_actualizada"
          ) {
            try {
              const data = JSON.parse(msg.payload);

              // 🔥 AHORA data contiene TODA la estructura de la vista
              // Con el mismo formato que tus otras consultas
              console.log("📨 Notificación en tiempo real recibida:", data);

              // Limpiar y resolver
              this.pool.removeListener("notification", notificationHandler);
              this.pool.end().catch(console.error);

              resolve(data);
            } catch (error) {
              this.pool.removeListener("notification", notificationHandler);
              this.pool.end().catch(console.error);
              reject(error);
            }
          }
        };

        this.pool.on("notification", notificationHandler);

        // Suscribirse a los canales
        await this.pool.query("LISTEN nueva_notificacion;");
        await this.pool.query("LISTEN notificacion_actualizada;");

        // Timeout
        setTimeout(() => {
          this.pool.removeListener("notification", notificationHandler);
          this.pool.end().catch(console.error);
          resolve(null);
        }, timeoutMs);
      } catch (error) {
        console.error("❌ Error en listenNotifications:", error);
        reject(error);
      }
    });
  }

  /**
   * Envía una notificación a un usuario específico a través de su sala personal de Socket.io.
   *
   * @async
   * @method sendToUser
   * @param {string|number} userId - ID del usuario destinatario
   * @param {Object} notification - Objeto de notificación a enviar
   * @param {string} notification.title - Título de la notificación
   * @param {string} notification.message - Mensaje de la notificación
   * @param {any} [notification.data] - Datos adicionales de la notificación
   *
   * @example
   * // Enviar notificación personal a un usuario
   * await notificationService.sendToUser(31264460, {
   *   title: "Mensaje personal",
   *   message: "Tienes un nuevo mensaje",
   *   data: { messageId: 123 }
   * });
   *
   * @description
   * La notificación se envía a la sala 'user_{userId}' usando Socket.io.
   * Solo los clientes conectados del usuario específico recibirán esta notificación.
   */
  async sendToUser(userId) {
    try {
      const notification = await this.searchNotificationUser(userId);
      notification.push(await this.searchNotificationDestinatario(userId));
      // Emitir a la sala personal del usuario
      //console.log(`user_${userId} esto es su data:`, notification);
      this.io.to(`user_${userId}`).emit("new_notification", notification);

      //console.log(`📨 Notificación enviada a usuario ${userId}`);
    } catch (error) {
      //console.error("❌ Error enviando notificación a usuario:", error);
    }
  }

  /**
   * Envía una notificación a múltiples roles simultáneamente.
   *
   * @async
   * @method sendToRoles
   * @param {string[]} roles - Array de roles destinatarios
   *
   * @example
   * // Enviar notificación a profesores y administradores
   * await notificationService.sendToRoles(['profesor', 'admin']);
   *
   * @description
   * Itera sobre cada rol y envía la notificación a su respectiva sala.
   * Cada rol recibe la misma notificación de forma independiente.
   */
  async sendToRoles(roles) {
    try {
      const notification = await this.searchNotificationRoles(roles);

      ////console.log("🔍 Notificación encontrada:", notification);
      ////console.log("🎯 Roles destino:", roles);

      // Usar this.socketService.io que es la instancia real del servidor
      const io = this.socketService.io;

      ////console.log("🔧 Usando this.socketService.io");
      ////console.log("🔧 ¿Tiene sockets?", !!io.sockets);
      ////console.log("🔧 ¿Tiene adapter?", !!io.sockets?.adapter);

      roles.forEach((role) => {
        const roomName = `role_${role.toLowerCase()}`;

        // Usar io.sockets.adapter
        const room = io.sockets.adapter.rooms.get(roomName);
        const numClients = room ? room.size : 0;

        ////console.log(`📤 Enviando a sala: ${roomName} (${numClients} clientes)`);

        // Enviar con io
        io.to(roomName).emit("new_notification", {
          success: true,
          data: notification,
          timestamp: new Date().toISOString(),
        });
      });

      ////console.log(`✅ Notificación enviada a roles: ${roles.join(", ")}`);
    } catch (error) {
      ////console.error("❌ Error enviando notificación a roles:", error);
    }
  }

  /**
   * Envía notificaciones globales a todos los usuarios conectados en el sistema.
   * Las notificaciones globales son aquellas que no están dirigidas a usuarios o roles específicos.
   *
   * @async
   * @method sendToGlobals
   * @returns {Promise<void>} Promesa que se resuelve cuando se envían las notificaciones
   * @throws {Error} Cuando ocurre un error al buscar o enviar las notificaciones globales
   *
   * @example
   * // Enviar todas las notificaciones globales a los usuarios conectados
   * await notificationService.sendToGlobals();
   *
   * @example
   * // Uso en conjunto con otros métodos de envío
   * await notificationService.sendToGlobals();
   * await notificationService.sendToRole('admin', notificacionEspecifica);
   *
   * @description
   * Este método realiza las siguientes acciones:
   * 1. Busca todas las notificaciones globales usando searchNotificationGlobales()
   * 2. Envía cada notificación global a través del canal 'new_notification'
   * 3. Las notificaciones se envían a todos los clientes conectados (this.io.emit)
   * 4. Registra en consola el número de notificaciones globales enviadas
   *
   * Las notificaciones globales son ideales para anuncios del sistema, mantenimientos programados,
   * o información relevante para todos los usuarios de la plataforma.
   */
  async sendToGlobals() {
    try {
      // Obtener todas las notificaciones globales desde la base de datos
      const globalNotifications = await this.searchNotificationGlobales();

      // Enviar cada notificación global a todos los clientes conectados
      globalNotifications.forEach((notification) => {
        this.io.emit("new_notification", {
          data: notification,
        });
      });
    } catch (error) {
      //console.error("❌ Error enviando notificaciones globales:", error);
      throw error;
    }
  }

  /**
   * Marca una notificación como leída para un usuario específico.
   *
   * @async
   * @method markAsRead
   * @param {string|number} notificationId - ID de la notificación a marcar como leída.
   * @param {string|number} userId - ID del usuario que marca la notificación como leída.
   * @returns {Promise<Object>} Promesa que resuelve con el estado de lectura actualizado (de notification_recipients).
   */
  async markAsRead(notificationId, userId) {
    const client = await this.connectDB();
    try {
      // ❌ CAMBIO CRUCIAL: La actualización se hace en la tabla notification_recipients.
      // Se utilizan dos condiciones: notification_id ($1) y user_id ($2).
      const result = await client.query(
        `UPDATE public.notification_recipients
             SET is_read = TRUE, read_at = NOW()
             WHERE notification_id = $1 AND user_id = $2
             RETURNING *`, // Retorna el registro de lectura actualizado
        [notificationId, userId] // Se pasan ambos IDs
      );

      if (result.rows.length > 0) {
        const updatedRecipientStatus = result.rows[0];

        // ✅ Notificación en tiempo real para el usuario específico (o el canal de notificaciones)
        // Se emite un evento para que el cliente que hizo la acción actualice su lista
        this.io.to(`user:${userId}`).emit("notification_updated", {
          notificationId: updatedRecipientStatus.notification_id,
          userId: updatedRecipientStatus.user_id,
          is_read: true,
          read_at: updatedRecipientStatus.read_at,
          action: "marked_read",
        });

        return updatedRecipientStatus;
      } else {
        // Error si no se encontró la fila. Esto puede significar:
        // 1. La notificación no existe.
        // 2. La notificación existe, pero no está dirigida a este usuario (no hay registro en notification_recipients).
        throw new Error(
          `Estado de Notificación ID ${notificationId} no encontrado para el Usuario ID ${userId}.`
        );
      }
    } catch (error) {
      console.error("Error en markAsRead:", error);
      throw error;
    } finally {
      // Es crucial liberar el cliente de la base de datos si usas pool.connect()
      // client.release(); // (Depende de tu implementación de connectDB)
    }
  }

  /**
   * Crea una notificación individual y la envía en tiempo real al usuario
   */
  async crearNotificacionIndividual({
    titulo,
    tipo,
    user_id,
    contenido = null,
    metadatos = null,
  }) {
    try {
      // 1. Crear notificación usando la función PostgreSQL
      const result = await this.pool.query(
        `SELECT utils.registrar_notificacion($1, $2, $3, $4, $5, $6, $7) as notification_id`,
        [titulo, tipo, user_id, contenido, false, null, metadatos]
      );

      const notificationId = result.rows[0].notification_id;

      // 2. Obtener datos completos de la vista
      const notificacionCompleta = await this.pool.query(
        `SELECT * FROM vista_notificaciones_completa WHERE id = $1`,
        [notificationId]
      );

      const notificacion = notificacionCompleta.rows[0];

      if (this.io) {
        this.io.to(`user_${user_id}`).emit("new_notification", {
          success: true,
          data: [notificacion], // Mismo formato que el frontend espera
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
   * Crea una notificación masiva y la envía en tiempo real a los roles/destinatarios
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
      // 1. Crear notificación masiva usando la función PostgreSQL
      const result = await this.pool.query(
        `SELECT utils.registrar_notificacion_masiva($1, $2, $3, $4, $5, $6) as notification_id`,
        [tipo, titulo, contenido, metadatos, roles_ids, users_ids]
      );

      const notificationId = result.rows[0].notification_id;

      // 2. Obtener datos completos de la vista
      const notificacionCompleta = await this.pool.query(
        `SELECT * FROM vista_notificaciones_completa WHERE id = $1`,
        [notificationId]
      );

      const notificacion = notificacionCompleta.rows[0];

      // 3. ✅ ENVIAR EN TIEMPO REAL a los destinatarios
      if (this.io) {
        // Enviar a roles
        if (
          notificacion.roles_destinatarios &&
          notificacion.roles_destinatarios.length > 0
        ) {
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

        // Enviar a usuarios específicos
        if (
          notificacion.usuarios_destinatarios &&
          notificacion.usuarios_destinatarios.length > 0
        ) {
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
   * Agrega un rol destinatario a una notificación existente y notifica en tiempo real
   */
  async agregarRolDestinatario(notification_id, role_id) {
    try {
      // 1. Registrar el rol usando la función PostgreSQL
      await this.pool.query(`SELECT utils.registrar_rol_notificacion($1, $2)`, [
        notification_id,
        role_id,
      ]);

      // 2. Obtener notificación actualizada
      const notificacionCompleta = await this.pool.query(
        `SELECT * FROM vista_notificaciones_completa WHERE id = $1`,
        [notification_id]
      );

      const notificacion = notificacionCompleta.rows[0];

      // 3. ✅ ENVIAR EN TIEMPO REAL al nuevo rol
      if (this.io) {
        // Obtener el nombre del rol (necesitarías una consulta adicional)
        const roleResult = await this.pool.query(
          `SELECT nombre_rol FROM roles WHERE id_rol = $1`,
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
   * Agrega un usuario destinatario a una notificación existente y notifica en tiempo real
   */
  async agregarUsuarioDestinatario(notification_id, user_id, is_read = false) {
    try {
      // 1. Registrar el destinatario usando la función PostgreSQL
      await this.pool.query(
        `SELECT utils.registrar_destinatario_notificacion($1, $2, $3)`,
        [notification_id, user_id, is_read]
      );

      // 2. Obtener notificación actualizada
      const notificacionCompleta = await this.pool.query(
        `SELECT * FROM vista_notificaciones_completa WHERE id = $1`,
        [notification_id]
      );

      const notificacion = notificacionCompleta.rows[0];

      // 3. ✅ ENVIAR EN TIEMPO REAL al nuevo usuario
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
   * Método completo para crear notificación con destinatarios flexibles
   */
  async crearNotificacionCompleta({
    titulo,
    tipo,
    contenido = null,
    metadatos = null,
    user_id = null, // Para notificación individual
    roles_ids = [], // Para notificación masiva por roles
    users_ids = [], // Para notificación masiva por usuarios
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
