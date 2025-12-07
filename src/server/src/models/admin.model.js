// Importación de Knex
import db from "../database/db.js";

// Importación de clase para formateo de respuestas
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class AdminModel
 * @description Contiene los métodos para todas las operaciones relacionadas con administradores
 * Usa Knex para todas las operaciones de base de datos
 */
export default class AdminModel {
  /**
   * @static
   * @async
   * @method crear
   * @description Crear un nuevo administrador en el sistema
   */
  static async crear(datos, id_usuario) {
    try {
      const {
        cedula,
        nombres,
        apellidos,
        email,
        roles,
        direccion,
        password,
        telefono_movil,
        telefono_local = null,
        imagen = null,
        fecha_nacimiento,
        genero,
      } = datos;

      // Usar Knex.raw para procedimientos almacenados
      const result = await db.raw(
        `CALL public.registrar_administrador_completo(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          id_usuario,
          cedula,
          nombres,
          apellidos,
          email,
          direccion,
          password,
          telefono_movil,
          telefono_local,
          imagen,
          fecha_nacimiento,
          genero,
          roles[0].id_rol,
        ]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Administrador creado exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.crear" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error en la creación del administrador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerTodos
   * @description Obtener todos los administradores con soporte para parámetros de consulta
   */
  static async obtenerTodos(queryParams = {}) {
    try {
      // Construir query con Knex
      let query = db("vista_usuarios").select(
        "cedula",
        "nombres",
        "apellidos",
        "imagen",
        "direccion",
        "telefono_movil",
        "telefono_local",
        "fecha_nacimiento",
        "genero",
        "email",
        "activo",
        "primera_vez",
        "last_login",
        "created_at",
        "updated_at",
        "roles",
        "id_roles",
        "nombre_roles"
      );

      // --- 1. Aplicar Filtros ---

      // Filtro por Rol (buscar en el array de roles)
      if (queryParams.rol) {
        query = query.whereRaw("? = ANY(id_roles)", [parseInt(queryParams.rol)]);
      }

      // Filtro por Estado (activo/inactivo)
      if (queryParams.estado !== undefined && queryParams.estado !== "") {
        const estadoBoolean = queryParams.estado === "true" || queryParams.estado === true;
        query = query.where("activo", estadoBoolean);
      }

      // Filtro por Cédula (búsqueda parcial)
      if (queryParams.cedula) {
        query = query.where("cedula", "ilike", `%${queryParams.cedula}%`);
      }

      // Filtro por Nombre (búsqueda parcial)
      if (queryParams.nombre) {
        query = query.where(function() {
          this.where("nombres", "ilike", `%${queryParams.nombre}%`)
            .orWhere("apellidos", "ilike", `%${queryParams.nombre}%`);
        });
      }

      // Filtro por Email (búsqueda parcial)
      if (queryParams.email) {
        query = query.where("email", "ilike", `%${queryParams.email}%`);
      }

      // Filtro por Género
      if (queryParams.genero) {
        query = query.where("genero", queryParams.genero);
      }

      // --- 2. Aplicar Ordenamiento ---
      if (queryParams.sort) {
        const allowedSortFields = [
          "cedula",
          "nombres",
          "apellidos",
          "email",
          "activo",
          "fecha_nacimiento",
          "last_login",
          "created_at",
        ];

        const sortField = allowedSortFields.includes(
          queryParams.sort.toLowerCase()
        )
          ? queryParams.sort.toLowerCase()
          : "created_at";

        const sortOrder =
          queryParams.order?.toUpperCase() === "DESC" ? "desc" : "asc";

        query = query.orderBy(sortField, sortOrder);
      } else {
        query = query.orderBy("created_at", "desc");
      }

      // --- 3. Aplicar Paginación ---
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;

        query = query.limit(limit).offset(offset);
      }

      console.log("🔍 Query Knex construida");

      // Ejecutar la consulta
      const rows = await query;

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Administradores obtenidos exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerTodos:", error);
      error.details = { path: "AdminModel.obtenerTodos" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener los administradores"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscarPorId
   * @description Buscar un administrador específico por su cédula
   */
  static async buscarPorId(cedula) {
    try {
      const admin = await db("vista_usuarios")
        .select(
          "cedula",
          "nombres",
          "apellidos",
          "imagen",
          "direccion",
          "telefono_movil",
          "telefono_local",
          "fecha_nacimiento",
          "genero",
          "email",
          "activo",
          "primera_vez",
          "last_login",
          "created_at",
          "updated_at",
          "roles",
          "id_roles",
          "nombre_roles"
        )
        .where("cedula", cedula)
        .first();

      return FormatterResponseModel.respuestaPostgres(
        admin ? [admin] : [],
        admin ? "Administrador obtenido exitosamente" : "Administrador no encontrado"
      );
    } catch (error) {
      error.details = { path: "AdminModel.buscarPorId" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al buscar administrador por cédula"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscarPorEmail
   * @description Buscar administradores por email
   */
  static async buscarPorEmail(email) {
    try {
      const admins = await db("vista_usuarios")
        .select(
          "cedula",
          "nombres",
          "apellidos",
          "imagen",
          "direccion",
          "telefono_movil",
          "telefono_local",
          "fecha_nacimiento",
          "genero",
          "email",
          "activo",
          "primera_vez",
          "last_login",
          "created_at",
          "updated_at",
          "roles",
          "id_roles",
          "nombre_roles"
        )
        .where("email", email)
        .where("activo", true);

      return FormatterResponseModel.respuestaPostgres(
        admins,
        "Búsqueda por email completada"
      );
    } catch (error) {
      error.details = { path: "AdminModel.buscarPorEmail" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al buscar administrador por email"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscar
   * @description Buscar administradores por término de búsqueda
   */
  static async buscar(termino) {
    try {
      const searchTerm = `%${termino}%`;
      
      const admins = await db("vista_usuarios")
        .select(
          "cedula",
          "nombres",
          "apellidos",
          "imagen",
          "direccion",
          "telefono_movil",
          "telefono_local",
          "fecha_nacimiento",
          "genero",
          "email",
          "activo",
          "primera_vez",
          "last_login",
          "created_at",
          "updated_at",
          "roles",
          "id_roles",
          "nombre_roles"
        )
        .where("activo", true)
        .where(function() {
          this.where("cedula", "ilike", searchTerm)
            .orWhere("nombres", "ilike", searchTerm)
            .orWhere("apellidos", "ilike", searchTerm)
            .orWhere("email", "ilike", searchTerm);
        })
        .orderBy("nombres", "asc")
        .orderBy("apellidos", "asc");

      return FormatterResponseModel.respuestaPostgres(
        admins,
        "Búsqueda de administradores completada"
      );
    } catch (error) {
      error.details = { path: "AdminModel.buscar" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al buscar administradores"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizar
   * @description Actualizar los datos de un administrador existente
   */
  static async actualizar(cedula, datos, id_usuario) {
    try {
      // Campos permitidos para actualización
      const camposPermitidos = [
        "nombres",
        "apellidos",
        "email",
        "direccion",
        "telefono_movil",
        "telefono_local",
        "fecha_nacimiento",
        "genero",
        "activo",
      ];

      // Filtrar solo los campos permitidos y que tengan valor
      const datosActualizacion = {};
      for (const [campo, valor] of Object.entries(datos)) {
        if (camposPermitidos.includes(campo) && valor !== undefined) {
          datosActualizacion[campo] = valor;
        }
      }

      if (Object.keys(datosActualizacion).length === 0) {
        return FormatterResponseModel.respuestaPostgres(
          [],
          "No hay campos válidos para actualizar"
        );
      }

      // Agregar timestamp de actualización
      datosActualizacion.updated_at = db.fn.now();

      // Ejecutar actualización con Knex
      const result = await db("users")
        .where("cedula", cedula)
        .update(datosActualizacion);

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
        "Administrador actualizado exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.actualizar" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar administrador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizarPerfil
   * @description Actualizar el perfil del administrador autenticado
   */
  static async actualizarPerfil(cedula, datos) {
    try {
      // Campos permitidos para actualización de perfil
      const camposPermitidos = [
        "nombres",
        "apellidos",
        "email",
        "direccion",
        "telefono_movil",
        "telefono_local",
      ];

      // Filtrar datos
      const datosActualizacion = {};
      for (const [campo, valor] of Object.entries(datos)) {
        if (camposPermitidos.includes(campo) && valor !== undefined) {
          datosActualizacion[campo] = valor;
        }
      }

      if (Object.keys(datosActualizacion).length === 0) {
        return FormatterResponseModel.respuestaPostgres(
          [],
          "No hay campos válidos para actualizar en el perfil"
        );
      }

      // Agregar timestamp
      datosActualizacion.updated_at = db.fn.now();

      // Ejecutar actualización
      const result = await db("users")
        .where("cedula", cedula)
        .update(datosActualizacion);

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
        "Perfil actualizado exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.actualizarPerfil" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar perfil"
      );
    }
  }

  /**
   * @static
   * @async
   * @method desactivar
   * @description Desactivar un administrador del sistema
   */
  static async desactivar(cedula, id_usuario) {
    try {
      const result = await db("users")
        .where("cedula", cedula)
        .update({
          activo: false,
          updated_at: db.fn.now()
        });

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
        "Administrador desactivado exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.desactivar" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al desactivar administrador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method activar
   * @description Activar un administrador del sistema
   */
  static async activar(cedula, id_usuario) {
    try {
      const result = await db("users")
        .where("cedula", cedula)
        .update({
          activo: true,
          updated_at: db.fn.now()
        });

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
        "Administrador activado exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.activar" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al activar administrador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method cambiarRol
   * @description Actualizar los roles de un administrador
   */
  static async cambiarRol(cedula, nuevos_roles_ids, id_usuario) {
    try {
      // Usar Knex.raw para procedimiento almacenado
      const result = await db.raw(
        `CALL public.actualizar_roles_administrador_usuario(?, ?, ?, NULL)`,
        [id_usuario, cedula, nuevos_roles_ids]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Roles de administrador actualizados exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "AdminModel.cambiarRol",
        cedula,
        nuevos_roles_ids,
        id_usuario,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar roles de administrador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method quitarRol
   * @description Quitar un rol específico de un administrador
   */
  static async quitarRol(cedula, rol_id, id_usuario) {
    try {
      const result = await db("usuario_rol")
        .where("usuario_id", cedula)
        .where("rol_id", rol_id)
        .delete();

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
        "Rol quitado exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.quitarRol" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al quitar rol del administrador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method filtrarPorRol
   * @description Filtrar administradores por rol específico
   */
  static async filtrarPorRol(rol_id) {
    try {
      const admins = await db("vista_usuarios")
        .select(
          "cedula",
          "nombres",
          "apellidos",
          "imagen",
          "direccion",
          "telefono_movil",
          "telefono_local",
          "fecha_nacimiento",
          "genero",
          "email",
          "activo",
          "primera_vez",
          "last_login",
          "created_at",
          "updated_at",
          "roles",
          "id_roles",
          "nombre_roles"
        )
        .whereRaw("? = ANY(id_roles)", [parseInt(rol_id)])
        .where("activo", true)
        .orderBy("nombres", "asc")
        .orderBy("apellidos", "asc");

      return FormatterResponseModel.respuestaPostgres(
        admins,
        `Administradores con rol ${rol_id} obtenidos exitosamente`
      );
    } catch (error) {
      error.details = { path: "AdminModel.filtrarPorRol" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al filtrar administradores por rol"
      );
    }
  }

  /**
   * @static
   * @async
   * @method filtrarPorEstado
   * @description Filtrar administradores por estado específico
   */
  static async filtrarPorEstado(estado) {
    try {
      const admins = await db("vista_usuarios")
        .select(
          "cedula",
          "nombres",
          "apellidos",
          "imagen",
          "direccion",
          "telefono_movil",
          "telefono_local",
          "fecha_nacimiento",
          "genero",
          "email",
          "activo",
          "primera_vez",
          "last_login",
          "created_at",
          "updated_at",
          "roles",
          "id_roles",
          "nombre_roles"
        )
        .where("activo", estado)
        .orderBy("nombres", "asc")
        .orderBy("apellidos", "asc");

      const estadoTexto = estado ? "activos" : "inactivos";
      return FormatterResponseModel.respuestaPostgres(
        admins,
        `Administradores ${estadoTexto} obtenidos exitosamente`
      );
    } catch (error) {
      error.details = { path: "AdminModel.filtrarPorEstado" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al filtrar administradores por estado"
      );
    }
  }

  /**
   * @static
   * @async
   * @method contarPorRolYEstado
   * @description Contar administradores por rol y estado
   */
  static async contarPorRolYEstado(rol_id, estado) {
    try {
      const count = await db("vista_usuarios")
        .count("* as total")
        .whereRaw("? = ANY(id_roles)", [parseInt(rol_id)])
        .where("activo", estado)
        .first();

      return FormatterResponseModel.respuestaPostgres(
        [count],
        "Conteo de administradores completado"
      );
    } catch (error) {
      error.details = { path: "AdminModel.contarPorRolYEstado" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al contar administradores por rol y estado"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizarUltimoAcceso
   * @description Actualizar la fecha del último acceso del administrador
   */
  static async actualizarUltimoAcceso(cedula) {
    try {
      const result = await db("users")
        .where("cedula", cedula)
        .update({
          last_login: db.fn.now()
        });

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
        "Último acceso actualizado"
      );
    } catch (error) {
      error.details = { path: "AdminModel.actualizarUltimoAcceso" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar último acceso"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerRolesDisponibles
   * @description Obtener todos los roles disponibles en el sistema
   */
  static async obtenerRolesDisponibles() {
    try {
      const roles = await db("roles")
        .select("id_rol", "nombre_rol", "descripcion")
        .where("activo", true)
        .orderBy("nombre_rol", "asc");

      return FormatterResponseModel.respuestaPostgres(
        roles,
        "Roles disponibles obtenidos exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.obtenerRolesDisponibles" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener roles disponibles"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerEstadisticas
   * @description Obtener estadísticas de administradores
   */
  static async obtenerEstadisticas() {
    try {
      const [totalAdmins, activos, inactivos] = await Promise.all([
        db("vista_usuarios").count("* as total").first(),
        db("vista_usuarios").count("* as total").where("activo", true).first(),
        db("vista_usuarios").count("* as total").where("activo", false).first(),
      ]);

      const estadisticas = {
        total: parseInt(totalAdmins.total),
        activos: parseInt(activos.total),
        inactivos: parseInt(inactivos.total),
      };

      return FormatterResponseModel.respuestaPostgres(
        [estadisticas],
        "Estadísticas obtenidas exitosamente"
      );
    } catch (error) {
      error.details = { path: "AdminModel.obtenerEstadisticas" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener estadísticas"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerPorRangoFechas
   * @description Obtener administradores creados en un rango de fechas
   */
  static async obtenerPorRangoFechas(fechaInicio, fechaFin) {
    try {
      const admins = await db("vista_usuarios")
        .select(
          "cedula",
          "nombres",
          "apellidos",
          "email",
          "activo",
          "created_at"
        )
        .whereBetween("created_at", [fechaInicio, fechaFin])
        .orderBy("created_at", "desc");

      return FormatterResponseModel.respuestaPostgres(
        admins,
        "Administradores obtenidos por rango de fechas"
      );
    } catch (error) {
      error.details = { path: "AdminModel.obtenerPorRangoFechas" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener administradores por rango de fechas"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscarConPaginacionAvanzada
   * @description Búsqueda avanzada con múltiples filtros y paginación
   */
  static async buscarConPaginacionAvanzada(filtros = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = "created_at",
        order = "desc",
        search = "",
        roles = [],
        estado,
        genero,
        fechaDesde,
        fechaHasta,
      } = filtros;

      // Construir query
      let query = db("vista_usuarios");

      // Aplicar filtros
      if (search) {
        const searchTerm = `%${search}%`;
        query = query.where(function() {
          this.where("cedula", "ilike", searchTerm)
            .orWhere("nombres", "ilike", searchTerm)
            .orWhere("apellidos", "ilike", searchTerm)
            .orWhere("email", "ilike", searchTerm);
        });
      }

      if (roles.length > 0) {
        query = query.where(function() {
          roles.forEach((rolId) => {
            this.orWhereRaw("? = ANY(id_roles)", [parseInt(rolId)]);
          });
        });
      }

      if (estado !== undefined) {
        query = query.where("activo", estado);
      }

      if (genero) {
        query = query.where("genero", genero);
      }

      if (fechaDesde && fechaHasta) {
        query = query.whereBetween("created_at", [fechaDesde, fechaHasta]);
      }

      // Obtener total para paginación
      const totalResult = await query.clone().count("* as total").first();
      const total = parseInt(totalResult.total);

      // Aplicar paginación
      const offset = (page - 1) * limit;
      const admins = await query
        .select("*")
        .orderBy(sort, order)
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      return FormatterResponseModel.respuestaPostgres(
        {
          admins,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        "Búsqueda avanzada completada"
      );
    } catch (error) {
      error.details = { path: "AdminModel.buscarConPaginacionAvanzada" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error en búsqueda avanzada"
      );
    }
  }
}