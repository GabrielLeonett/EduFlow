// Importación de la conexión a la base de datos
import db from "../database/db.js";

// Importación de clase para formateo de respuestas
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class AulaModel
 * @description Contiene los métodos para todas las operaciones relacionadas con aulas
 */
export default class AulaModel {
  /**
   * @static
   * @async
   * @method crear
   * @description Crear una nueva aula en el sistema
   * @param {Object} datos - Datos del aula a crear
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async crear(datos, id_usuario) {
    try {
      const { id_sede, codigo, tipo, capacidad, id_pnf } = datos;
      const query = `CALL registrar_aula_completo(?,  ?,  ?,  ?,  ?,  ?, NULL)`;

      const params = [
        id_usuario,
        id_sede,
        codigo,
        tipo,
        capacidad,
        id_pnf || null,
      ];
      console.log(query, params);
      const { rows } = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Aula creada exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.crear" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error en la creación del aula"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerTodas
   * @description Obtener todas las aulas (a través de la vista vista_sedes_completa) con soporte para parámetros de consulta
   * @param {Object} queryParams - Parámetros de consulta (paginación, filtros, ordenamiento)
   * @returns {Promise<Object>} Lista de aulas
   */
  static async obtenerTodas(queryParams = {}) {
    try {
      let query = `
       SELECT 
         id_sede,
         nombre_sede,
         ubicacion_sede,
         google_sede,
         id_aula,
         codigo_aula,
         tipo_aula,
         capacidad_aula
       FROM 
         public.vistas_aulas
       WHERE 1=1
     `;
      const params = [];

      // --- 1. Aplicar Filtros ---

      // Filtro por ID de Sede
      if (queryParams.idSede) {
        query += ` AND id_sede = ?`;
        params.push(queryParams.idSede);
      }

      // Filtro por Tipo de Aula
      if (queryParams.tipo) {
        query += ` AND tipo_aula = ?`; // Usando 'tipo_aula' de la vista
        params.push(queryParams.tipo);
      }

      // Filtro por Código de Aula (ILIKE para búsqueda parcial)
      if (queryParams.codigo) {
        query += ` AND codigo_aula ILIKE ?`; // Usando 'codigo_aula' de la vista
        params.push(`%${queryParams.codigo}%`);
      }

      // Filtro por Capacidad (ejemplo)
      if (queryParams.minCapacidad) {
        query += ` AND capacidad_aula >= ?`;
        params.push(parseInt(queryParams.minCapacidad));
      }

      // --- 2. Aplicar Ordenamiento ---

      if (queryParams.sort) {
        // Campos permitidos para ordenar de la vista
        const allowedSortFields = [
          "nombre_sede",
          "codigo_aula",
          "tipo_aula",
          "capacidad_aula",
        ];
        const sortField = allowedSortFields.includes(queryParams.sort)
          ? queryParams.sort
          : "nombre_sede"; // Default
        const sortOrder =
          queryParams.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

        // El ordenamiento se aplica directamente a los campos de la vista
        query += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        // Ordenamiento por defecto
        query += ` ORDER BY nombre_sede ASC, codigo_aula ASC`;
      }

      // --- 3. Aplicar Paginación ---

      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;

        query += ` LIMIT ? OFFSET ?`;
        // Los parámetros de límite y offset van al final
        params.push(limit, offset);
      }

      // 🚀 Ejecutar la consulta con parámetros
      const { rows } = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Aulas obtenidas exitosamente (desde vista)"
      );
    } catch (error) {
      error.details = { path: "AulaModel.obtenerTodas" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener las aulas"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscarPorId
   * @description Buscar un aula específica por su ID
   * @param {number} id_aula - ID del aula a buscar
   * @returns {Promise<Object>} Datos del aula
   */
  static async buscarPorId(id_aula) {
    try {
      const query = `
        SELECT 
          a.id_aula,
          a.codigo,
          a.nombre,
          a.tipo,
          a.capacidad,
          a.equipamiento,
          a.estado,
          s.id_sede,
          s.nombre as nombre_sede,
          a.fecha_creacion,
          a.fecha_actualizacion,
          u_creador.nombre as usuario_creador,
          u_actualizador.nombre as usuario_actualizador
        FROM public.aulas a
        INNER JOIN public.sedes s ON a.id_sede = s.id_sede
        LEFT JOIN public.usuarios u_creador ON a.id_usuario_creacion = u_creador.id_usuario
        LEFT JOIN public.usuarios u_actualizador ON a.id_usuario_actualizacion = u_actualizador.id_usuario
        WHERE a.id_aula = ?
      `;
      const params = [id_aula];

      const { rows } = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Aula obtenida exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.buscarPorId" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al buscar aula por ID"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizar
   * @description Actualizar los datos de un aula existente
   * @param {number} id_aula - ID del aula a actualizar
   * @param {Object} datos - Datos actualizados del aula
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizar(id_aula, datos, id_usuario) {
    try {
      // Construir la consulta dinámicamente basada en los campos proporcionados
      const campos = [];
      const params = [];

      // Campos permitidos para actualización
      const camposPermitidos = [
        "codigo",
        "nombre",
        "tipo",
        "capacidad",
        "equipamiento",
        "id_sede",
        "estado",
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

      // Agregar ID del aula y usuario que actualiza
      params.push(id_usuario, id_aula);

      const query = `
        UPDATE public.aulas 
        SET ${campos.join(
          ", "
        )}, fecha_actualizacion = CURRENT_TIMESTAMP, id_usuario_actualizacion = ?
        WHERE id_aula = ?
      `;

      const { rows } = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Aula actualizada exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.actualizar" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar aula"
      );
    }
  }

  /**
   * @static
   * @async
   * @method eliminar
   * @description Eliminar un aula del sistema (cambiar estado a inactivo)
   * @param {number} id_aula - ID del aula a eliminar
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async eliminar(id_aula, id_usuario) {
    try {
      const query = `
        UPDATE public.aulas 
        SET estado = 'INACTIVO', fecha_actualizacion = CURRENT_TIMESTAMP, id_usuario_actualizacion = ?
        WHERE id_aula = ?
      `;
      const params = [id_usuario, id_aula];

      const { rows } = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Aula eliminada exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.eliminar" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al eliminar aula"
      );
    }
  }

  /**
   * @static
   * @async
   * @method filtrarPorTipo
   * @description Filtrar aulas por tipo específico
   * @param {string} tipo - Tipo de aula a filtrar
   * @returns {Promise<Object>} Lista de aulas del tipo especificado
   */
  static async filtrarPorTipo(tipo) {
    try {
      const query = `
        SELECT 
          a.id_aula,
          a.codigo,
          a.nombre,
          a.tipo,
          a.capacidad,
          a.equipamiento,
          a.estado,
          s.id_sede,
          s.nombre as nombre_sede
        FROM public.aulas a
        INNER JOIN public.sedes s ON a.id_sede = s.id_sede
        WHERE a.tipo = ? AND a.estado = 'ACTIVO'
        ORDER BY a.nombre ASC
      `;
      const params = [tipo];

      const { rows } = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        `Aulas de tipo ${tipo} obtenidas exitosamente`
      );
    } catch (error) {
      error.details = { path: "AulaModel.filtrarPorTipo" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al filtrar aulas por tipo"
      );
    }
  }

  /**
   * @static
   * @async
   * @method filtrarPorSede
   * @description Filtrar aulas por sede específica con paginación, ordenamiento y búsqueda
   * @param {string} sede - ID de la sede a filtrar
   * @param {Object} queryParams - Parámetros de consulta
   * @param {string} queryParams.page - Página actual
   * @param {string} queryParams.limit - Límite por página
   * @param {string} queryParams.sort_order - Campo para ordenar
   * @param {string} queryParams.search - Término de búsqueda
   * @returns {Promise<Object>} Lista de aulas de la sede especificada con paginación
   */
  static async filtrarPorSede(sede, queryParams = {}) {
    try {
      const page = parseInt(queryParams.page) || 1;
      const limit = parseInt(queryParams.limit) || 10;
      const offset = (page - 1) * limit;
      const search = queryParams.search || "";
      const sortOrder = queryParams.sort_order || "codigo_aula";

      // Validar y mapear campos de ordenamiento
      const sortMapping = {
        codigo: "a.codigo_aula",
        tipo: "a.tipo_aula",
        capacidad: "a.capacidad_aula",
        fecha_creacion: "a.created_at",
        sede: "s.nombre_sede",
      };

      const orderBy = sortMapping[sortOrder] || "a.codigo_aula";

      let whereConditions = ["a.id_sede =?"];
      let params = [sede];
      let paramCount = 1;

      // Agregar condiciones de búsqueda si existe el parámetro
      if (search) {
        paramCount++;
        whereConditions.push(`(
        a.codigo_aula ILIKE $${paramCount} OR 
        a.tipo_aula ILIKE $${paramCount} OR 
        s.nombre_sede ILIKE $${paramCount}
      )`);
        params.push(`%${search}%`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Query para contar el total
      const countQuery = `
      SELECT COUNT(*) as total
      FROM public.aulas a
      INNER JOIN public.sedes s ON a.id_sede = s.id_sede
      ${whereClause}
    `;

      // Query principal con paginación y ordenamiento
      const dataQuery = `
      SELECT 
        a.id_aula,
        a.tipo_aula,
        a.capacidad_aula,
        a.codigo_aula,
        a.created_at as fecha_creacion,
        s.id_sede,
        s.nombre_sede
      FROM public.aulas a
      INNER JOIN public.sedes s ON a.id_sede = s.id_sede
      ${whereClause}
      ORDER BY ${orderBy} ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

      // Ejecutar query de conteo
      const countResult = await db.raw(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Ejecutar query principal
      const dataParams = [...params, limit, offset];
      const { rows } = await db.raw(dataQuery, dataParams);

      // Calcular información de paginación
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const data = {
        aulas: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };

      return FormatterResponseModel.respuestaPostgres(
        data,
        `Aulas de la sede ${sede} obtenidas exitosamente`
      );
    } catch (error) {
      error.details = { path: "AulaModel.filtrarPorSede" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al filtrar aulas por sede"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAulasPorPnf
   * @description Obtener aulas disponibles para un horario específico
   * @param {number} codigoPNF - Filtros de disponibilidad
   * @returns {Promise<Object>} Lista de aulas disponibles
   */
  static async obtenerAulasPorPnf(codigoPNF) {
    try {
      let query = `
        
      `;

      const { rows } = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Aulas disponibles obtenidas exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.obtenerDisponibles" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener aulas disponibles"
      );
    }
  }
}
