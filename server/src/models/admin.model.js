// Importación de la conexión a la base de datos
import pg from "../database/pg.js";

// Importación de clase para formateo de respuestas
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class AdminModel
 * @description Contiene los métodos para todas las operaciones relacionadas con administradores
 */
export default class AdminModel {
  /**
   * @static
   * @async
   * @method crear
   * @description Crear un nuevo administrador en el sistema
   * @param {Object} datos - Datos del administrador a crear
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
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

      const query = `CALL public.registrar_administrador_completo($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NULL);`;

      const params = [
        id_usuario, // p_usuario_accion
        cedula, // p_id (cedula como identificador)
        nombres, // p_nombres
        apellidos, // p_apellidos
        email, // p_email
        direccion, // p_direccion
        password, // p_password
        telefono_movil, // p_telefono_movil
        telefono_local, // p_telefono_local
        imagen,
        fecha_nacimiento, // p_fecha_nacimiento
        genero, // p_genero
        roles[0].id_rol, // p_id_rol
      ];
      console.log(params);
      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {Object} queryParams - Parámetros de consulta (paginación, filtros, ordenamiento)
   * @returns {Promise<Object>} Lista de administradores
   */
  static async obtenerTodos(queryParams = {}) {
    try {
      let query = `
      SELECT 
        cedula,
        nombres,
        apellidos,
        imagen,
        direccion,
        telefono_movil,
        telefono_local,
        fecha_nacimiento,
        genero,
        email,
        activo,
        primera_vez,
        last_login,
        created_at,
        updated_at,
        roles,
        id_roles,
        nombre_roles
      FROM public.vista_usuarios 
      WHERE 1=1
    `;
      const params = [];
      let paramCount = 0;

      // --- 1. Aplicar Filtros ---

      // Filtro por Rol (buscar en el array de roles)
      if (queryParams.rol) {
        paramCount++;
        query += ` AND $${paramCount} = ANY(id_roles)`;
        params.push(parseInt(queryParams.rol));
      }

      // Filtro por Estado (activo/inactivo)
      if (queryParams.estado !== undefined && queryParams.estado !== "") {
        paramCount++;
        query += ` AND activo = $${paramCount}`;
        params.push(
          queryParams.estado === "true" || queryParams.estado === true
        );
      }

      // Filtro por Cédula (búsqueda parcial)
      if (queryParams.cedula) {
        paramCount++;
        query += ` AND cedula::text LIKE $${paramCount}`;
        params.push(`%${queryParams.cedula}%`);
      }

      // Filtro por Nombre (búsqueda parcial)
      if (queryParams.nombre) {
        paramCount++;
        query += ` AND (nombres ILIKE $${paramCount}`;
        paramCount++;
        query += ` OR apellidos ILIKE $${paramCount})`;
        params.push(`%${queryParams.nombre}%`, `%${queryParams.nombre}%`);
      }

      // Filtro por Email (búsqueda parcial)
      if (queryParams.email) {
        paramCount++;
        query += ` AND email ILIKE $${paramCount}`;
        params.push(`%${queryParams.email}%`);
      }

      // Filtro por Género
      if (queryParams.genero) {
        paramCount++;
        query += ` AND genero = $${paramCount}`;
        params.push(queryParams.genero);
      }

      // --- 2. Aplicar Ordenamiento ---

      if (queryParams.sort) {
        // Campos permitidos para ordenar (adaptados a la vista)
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
          : "created_at"; // Default

        const sortOrder =
          queryParams.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

        query += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        // Ordenamiento por defecto
        query += ` ORDER BY created_at DESC`;
      }

      // --- 3. Aplicar Paginación ---

      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);
      }

      console.log("🔍 Query ejecutada:", query);
      console.log("🔍 Parámetros:", params);

      // 🚀 Ejecutar la consulta con parámetros
      const { rows } = await pg.query(query, params);

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
   * @param {number} cedula - Cédula del administrador a buscar
   * @returns {Promise<Object>} Datos del administrador
   */
  static async buscarPorId(cedula) {
    try {
      const query = `
        SELECT 
          cedula,
          nombres,
          apellidos,
          imagen,
          direccion,
          telefono_movil,
          telefono_local,
          fecha_nacimiento,
          genero,
          email,
          activo,
          primera_vez,
          last_login,
          created_at,
          updated_at,
          roles,
          id_roles,
          nombre_roles
        FROM public.vista_usuarios 
        WHERE cedula = $1
      `;
      const params = [cedula];

      const { rows } = await pg.query(query, params);
      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Administrador obtenido exitosamente"
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
   * @param {string} email - Email a buscar
   * @returns {Promise<Object>} Datos del administrador encontrado
   */
  static async buscarPorEmail(email) {
    try {
      const query = `
        SELECT 
          cedula,
          nombres,
          apellidos,
          imagen,
          direccion,
          telefono_movil,
          telefono_local,
          fecha_nacimiento,
          genero,
          email,
          activo,
          primera_vez,
          last_login,
          created_at,
          updated_at,
          roles,
          id_roles,
          nombre_roles
        FROM public.vista_usuarios 
        WHERE email = ? AND activo = true
      `;
      const params = [email];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @description Buscar administradores por término de búsqueda (cédula, nombre, apellido, email)
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Object>} Lista de administradores encontrados
   */
  static async buscar(termino) {
    try {
      const query = `
        SELECT 
          cedula,
          nombres,
          apellidos,
          imagen,
          direccion,
          telefono_movil,
          telefono_local,
          fecha_nacimiento,
          genero,
          email,
          activo,
          primera_vez,
          last_login,
          created_at,
          updated_at,
          roles,
          id_roles,
          nombre_roles
        FROM public.vista_usuarios 
        WHERE activo = true
          AND (
            cedula::text LIKE ? 
            OR nombres ILIKE ? 
            OR apellidos ILIKE ? 
            OR email ILIKE ?
          )
        ORDER BY nombres, apellidos ASC
      `;
      const searchTerm = `%${termino}%`;
      const params = [searchTerm, searchTerm, searchTerm, searchTerm];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {number} cedula - Cédula del administrador a actualizar
   * @param {Object} datos - Datos actualizados del administrador
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizar(cedula, datos, id_usuario) {
    try {
      // Construir la consulta dinámicamente basada en los campos proporcionados
      const campos = [];
      const params = [];

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

      for (const [campo, valor] of Object.entries(datos)) {
        if (camposPermitidos.includes(campo) && valor !== undefined) {
          campos.push(`${campo} = ?`);
          params.push(valor);
        }
      }

      if (campos.length === 0) {
        return FormatterResponseModel.respuestaPostgres(
          [],
          "No hay campos válidos para actualizar"
        );
      }

      // Agregar cédula del administrador
      params.push(cedula);

      const query = `
        UPDATE public.users 
        SET ${campos.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE cedula = ?
      `;

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {number} cedula - Cédula del administrador
   * @param {Object} datos - Datos actualizados del perfil
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizarPerfil(cedula, datos) {
    try {
      // Construir la consulta dinámicamente basada en los campos proporcionados
      const campos = [];
      const params = [];

      // Campos permitidos para actualización de perfil
      const camposPermitidos = [
        "nombres",
        "apellidos",
        "email",
        "direccion",
        "telefono_movil",
        "telefono_local",
      ];

      for (const [campo, valor] of Object.entries(datos)) {
        if (camposPermitidos.includes(campo) && valor !== undefined) {
          campos.push(`${campo} = ?`);
          params.push(valor);
        }
      }

      if (campos.length === 0) {
        return FormatterResponseModel.respuestaPostgres(
          [],
          "No hay campos válidos para actualizar en el perfil"
        );
      }

      // Agregar cédula del administrador
      params.push(cedula);

      const query = `
        UPDATE public.users 
        SET ${campos.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE cedula = ?
      `;

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @description Desactivar un administrador del sistema (cambiar estado a inactivo)
   * @param {number} cedula - Cédula del administrador a desactivar
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async desactivar(cedula, id_usuario) {
    try {
      const query = `
        UPDATE public.users 
        SET activo = false, updated_at = CURRENT_TIMESTAMP
        WHERE cedula = ?
      `;
      const params = [cedula];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @description Activar un administrador del sistema (cambiar estado a activo)
   * @param {number} cedula - Cédula del administrador a activar
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async activar(cedula, id_usuario) {
    try {
      const query = `
        UPDATE public.users 
        SET activo = true, updated_at = CURRENT_TIMESTAMP
        WHERE cedula = ?
      `;
      const params = [cedula];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @description Actualizar los roles de un administrador usando el nuevo procedimiento
   * @param {number} cedula - Cédula del administrador
   * @param {number[]} nuevos_roles_ids - Array de IDs de roles a asignar
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async cambiarRol(cedula, nuevos_roles_ids, id_usuario) {
    try {
      // Usar el nuevo procedimiento con array de roles
      const query = `
        CALL public.actualizar_roles_administrador_usuario($1, $2, $3, NULL)
      `;

      const params = [id_usuario, cedula, nuevos_roles_ids];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {number} cedula - Cédula del administrador
   * @param {number} rol_id - ID del rol a quitar
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async quitarRol(cedula, rol_id, id_usuario) {
    try {
      const query = `
        DELETE FROM public.usuario_rol 
        WHERE usuario_id = ? AND rol_id = ?
      `;
      const params = [cedula, rol_id];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {number} rol_id - ID del rol a filtrar
   * @returns {Promise<Object>} Lista de administradores del rol especificado
   */
  static async filtrarPorRol(rol_id) {
    try {
      const query = `
        SELECT 
          cedula,
          nombres,
          apellidos,
          imagen,
          direccion,
          telefono_movil,
          telefono_local,
          fecha_nacimiento,
          genero,
          email,
          activo,
          primera_vez,
          last_login,
          created_at,
          updated_at,
          roles,
          id_roles,
          nombre_roles
        FROM public.vista_usuarios 
        WHERE ? = ANY(id_roles) AND activo = true
        ORDER BY nombres, apellidos ASC
      `;
      const params = [parseInt(rol_id)];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {boolean} estado - Estado a filtrar (true=activo, false=inactivo)
   * @returns {Promise<Object>} Lista de administradores del estado especificado
   */
  static async filtrarPorEstado(estado) {
    try {
      const query = `
        SELECT 
          cedula,
          nombres,
          apellidos,
          imagen,
          direccion,
          telefono_movil,
          telefono_local,
          fecha_nacimiento,
          genero,
          email,
          activo,
          primera_vez,
          last_login,
          created_at,
          updated_at,
          roles,
          id_roles,
          nombre_roles
        FROM public.vista_usuarios 
        WHERE activo = ?
        ORDER BY nombres, apellidos ASC
      `;
      const params = [estado];

      const { rows } = await pg.query(query, params);

      const estadoTexto = estado ? "activos" : "inactivos";
      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {number} rol_id - ID del rol a contar
   * @param {boolean} estado - Estado a contar
   * @returns {Promise<Object>} Número de administradores que cumplen con los criterios
   */
  static async contarPorRolYEstado(rol_id, estado) {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM public.vista_usuarios 
        WHERE ? = ANY(id_roles) AND activo = ?
      `;
      const params = [parseInt(rol_id), estado];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @param {number} cedula - Cédula del administrador
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizarUltimoAcceso(cedula) {
    try {
      const query = `
        UPDATE public.users 
        SET last_login = CURRENT_TIMESTAMP
        WHERE cedula = ?
      `;
      const params = [cedula];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
   * @returns {Promise<Object>} Lista de roles disponibles
   */
  static async obtenerRolesDisponibles() {
    try {
      const query = `
        SELECT id_rol, nombre_rol, descripcion 
        FROM public.roles 
        WHERE activo = true 
        ORDER BY nombre_rol ASC
      `;

      const { rows } = await pg.query(query);

      return FormatterResponseModel.respuestaPostgres(
        rows,
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
}
