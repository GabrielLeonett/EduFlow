/**
 * @module CoordinadorModel
 * @description Modelo encargado exclusivamente de la interacción con la base de datos
 * para las operaciones relacionadas con los Coordinadores. Incluye asignación,
 * desasignación, listado, obtención, actualización y eliminación de coordinadores.
 */

// Importaciones principales
import pg from "../database/pg.js";
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

export default class CoordinadorModel {
  /**
   * @static
   * @async
   * @method asignarCoordinador
   * @description Asigna un profesor como coordinador de un PNF mediante un procedimiento almacenado
   * @param {Object} datos - Datos de asignación del coordinador
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async asignarCoordinador(datos, id_usuario) {
    try {
      const query = `CALL asignar_coordinador($1, $2, $3)`;
      const params = [id_usuario, datos.id_profesor, datos.id_pnf];
      console.log(params);
      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinador asignado correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.asignarCoordinador" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al asignar coordinador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method listarCoordinadores
   * @description Obtiene la lista de todos los coordinadores con soporte para parámetros de consulta
   * @param {Object} queryParams - Parámetros de consulta (paginación, filtros, ordenamiento)
   * @returns {Promise<Object>} Lista de coordinadores
   */
  static async listarCoordinadores(queryParams = {}) {
    try {
      let query = `SELECT * FROM public.coordinadores_informacion_completa WHERE 1=1`;
      const params = [];
      let paramCount = 0;

      // Aplicar filtros si están presentes
      if (queryParams.activo !== undefined) {
        paramCount++;
        query += ` AND activo = $${paramCount}`;
        params.push(queryParams.activo);
      }

      if (queryParams.id_pnf) {
        paramCount++;
        query += ` AND id_pnf = $${paramCount}`;
        params.push(queryParams.id_pnf);
      }

      // Aplicar búsqueda por nombres, apellidos o cédula
      if (queryParams.search) {
        paramCount++;
        query += ` AND (nombres ILIKE $${paramCount} OR apellidos ILIKE $${paramCount} OR cedula::TEXT ILIKE $${paramCount})`;
        params.push(`%${queryParams.search}%`);
      }

      // Aplicar ordenamiento
      if (queryParams.sort) {
        const allowedSortFields = [
          "nombres",
          "apellidos",
          "nombre_pnf",
          "fecha_ingreso",
          "cedula",
        ];
        const sortField = allowedSortFields.includes(queryParams.sort)
          ? queryParams.sort
          : "nombres";
        const sortOrder =
          queryParams.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        query += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        query += ` ORDER BY nombres ASC`;
      }

      // Aplicar paginación
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        if (offset > 0) {
          paramCount++;
          query += ` OFFSET $${paramCount}`;
          params.push(offset);
        }
      }

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Listado de coordinadores obtenido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.listarCoordinadores" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener coordinadores"
      );
    }
  }

  static async listarCoordinadoresDestituidos(queryParams = {}) {
    try {
      let query = `SELECT * FROM public.coordinadores_destituidos_completos WHERE 1=1`;
      const params = [];
      let paramCount = 0;

      // Mantener otros filtros
      if (queryParams.id_pnf) {
        paramCount++;
        query += ` AND id_pnf = $${paramCount}`;
        params.push(queryParams.id_pnf);
      }

      if (queryParams.nombre_pnf) {
        paramCount++;
        query += ` AND nombre_pnf ILIKE $${paramCount}`;
        params.push(`%${queryParams.nombre_pnf}%`);
      }

      if (queryParams.cedula) {
        paramCount++;
        query += ` AND cedula = $${paramCount}`;
        params.push(queryParams.cedula);
      }

      // Aplicar ordenamiento
      if (queryParams.sort) {
        const allowedSortFields = [
          "nombres",
          "apellidos",
          "nombre_pnf",
          "fecha_ingreso",
          "fecha_destitucion",
          "fecha_designacion",
        ];
        const sortField = allowedSortFields.includes(queryParams.sort)
          ? queryParams.sort
          : "nombres";
        const sortOrder =
          queryParams.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        query += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        query += ` ORDER BY fecha_destitucion DESC, nombres ASC`; // Orden por destitución reciente
      }

      // Aplicar paginación
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        if (offset > 0) {
          paramCount++;
          query += ` OFFSET $${paramCount}`;
          params.push(offset);
        }
      }

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Listado de coordinadores destituidos obtenido correctamente"
      );
    } catch (error) {
      error.details = {
        path: "CoordinadorModel.listarCoordinadoresDestituidos",
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener coordinadores destituidos"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerCoordinador
   * @description Obtiene un coordinador específico por su cédula
   * @param {number} cedula - Cédula del coordinador
   * @returns {Promise<Object>} Datos del coordinador
   */
  static async obtenerCoordinador(cedula) {
    try {
      const query = `
        SELECT * FROM public.coordinadores_informacion_completa 
        WHERE cedula = $1
      `;
      const params = [cedula];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinador obtenido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.obtenerCoordinador" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener coordinador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerCoordinadorPorId
   * @description Obtiene un coordinador específico por su ID de coordinador
   * @param {number} id_coordinador - ID del coordinador
   * @returns {Promise<Object>} Datos del coordinador
   */
  static async obtenerCoordinadorPorId(id_coordinador) {
    try {
      const query = `
        SELECT * FROM public.coordinadores_informacion_completa 
        WHERE id_coordinador = $1
      `;
      const params = [id_coordinador];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinador obtenido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.obtenerCoordinadorPorId" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener coordinador por ID"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizarCoordinador
   * @description Actualiza los datos de un coordinador existente
   * @param {number} id_coordinador - ID del coordinador a actualizar
   * @param {Object} datos - Datos actualizados del coordinador
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizarCoordinador(id_coordinador, datos, id_usuario) {
    try {
      // Construir la consulta dinámicamente basada en los campos proporcionados
      const campos = [];
      const params = [];
      let paramCount = 0;

      // Campos permitidos para actualización
      const camposPermitidos = [
        "fecha_inicio",
        "fecha_fin",
        "observaciones",
        "estado",
        "motivo_destitucion",
      ];

      for (const [campo, valor] of Object.entries(datos)) {
        if (camposPermitidos.includes(campo) && valor !== undefined) {
          paramCount++;
          campos.push(`${campo} = $${paramCount}`);
          params.push(valor);
        }
      }

      if (campos.length === 0) {
        return FormatterResponseModel.respuestaPostgres(
          [],
          "No hay campos válidos para actualizar"
        );
      }

      // Agregar ID del coordinador y usuario que actualiza
      paramCount++;
      params.push(id_coordinador);
      paramCount++;
      params.push(id_usuario);

      const query = `
        UPDATE public.coordinadores 
        SET ${campos.join(
          ", "
        )}, fecha_actualizacion = CURRENT_TIMESTAMP, id_usuario_actualizacion = $${paramCount}
        WHERE id_coordinador = $${paramCount - 1}
      `;

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinador actualizado correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.actualizarCoordinador" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar coordinador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method destituirCoordinador
   * @description Destituye un coordinador mediante un procedimiento almacenado
   * @param {number} id_coordinador - ID del coordinador a destituir
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @param {string} tipo_accion - Tipo de acción (DESTITUCION, RENUNCIA)
   * @param {string} razon - Razón de la destitución
   * @param {string} observaciones - Observaciones adicionales (opcional)
   * @param {string} fecha_efectiva - Fecha efectiva de la destitución (opcional)
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async destituirCoordinador(
    id_coordinador,
    id_usuario,
    tipo_accion,
    razon,
    observaciones = null,
    fecha_efectiva = null
  ) {
    try {
      const query = `CALL eliminar_destituir_coordinador(NULL, $1, $2, $3, $4, $5, $6)`;
      const params = [
        id_usuario,
        id_coordinador,
        tipo_accion,
        razon,
        observaciones,
        fecha_efectiva,
      ];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinador destituido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.destituirCoordinador" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al destituir coordinador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method restituirCoordinador
   * @description Restituye (reingresa) un coordinador destituido mediante un procedimiento almacenado
   * @param {number} id_coordinador - ID del coordinador a restituir
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @param {string} tipo_reingreso - Tipo de reingreso (REINGRESO, REINCORPORACION, REINTEGRO)
   * @param {string} motivo_reingreso - Motivo del reingreso
   * @param {string} observaciones - Observaciones adicionales (opcional)
   * @param {string} fecha_efectiva - Fecha efectiva del reingreso (opcional)
   * @param {number} registro_anterior_id - ID del registro de destitución anterior (opcional)
   * @param {number} id_pnf - ID del PNF al que se reasigna (opcional)
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async restituirCoordinador(
    id_coordinador,
    id_usuario,
    tipo_reingreso,
    motivo_reingreso,
    observaciones = null,
    fecha_efectiva = null,
    registro_anterior_id = null,
    id_pnf = null
  ) {
    try {
      const query = `CALL reingresar_coordinador($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
      const params = [
        id_usuario,
        id_coordinador,
        tipo_reingreso,
        motivo_reingreso,
        observaciones,
        fecha_efectiva,
        registro_anterior_id,
        id_pnf,
      ];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinador restituido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.restituirCoordinador" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al restituir coordinador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerHistorialDestituciones
   * @description Obtiene el historial de destituciones de un coordinador
   * @param {number} id_coordinador - ID del coordinador
   * @returns {Promise<Object>} Historial de destituciones
   */
  static async obtenerHistorialDestituciones(id_coordinador) {
    try {
      const query = `
        SELECT 
          d.id_registro,
          d.tipo_accion,
          d.razon,
          d.observaciones,
          d.fecha_efectiva,
          d.created_at,
          u.nombres || ' ' || u.apellidos as usuario_accion_nombre
        FROM destituciones d
        INNER JOIN coordinadores c ON d.usuario_id = c.id_profesor
        INNER JOIN users u ON d.usuario_accion = u.cedula
        WHERE c.id_coordinador = $1 AND d.rol_id = 2
        ORDER BY d.created_at DESC
      `;

      const { rows } = await pg.query(query, [id_coordinador]);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Historial obtenido correctamente"
      );
    } catch (error) {
      error.details = {
        path: "CoordinadorModel.obtenerHistorialDestituciones",
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener historial de destituciones"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerHistorialCoordinador
   * @description Obtiene el historial completo de coordinaciones de un profesor
   * @param {number} cedula_profesor - Cédula del profesor
   * @returns {Promise<Object>} Historial de coordinaciones
   */
  static async obtenerHistorialCoordinador(cedula_profesor) {
    try {
      const query = `
        SELECT * FROM public.coordinadores_informacion_completa 
        WHERE cedula = $1 
        ORDER BY fecha_inicio DESC
      `;
      const params = [cedula_profesor];

      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Historial de coordinador obtenido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.obtenerHistorialCoordinador" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener historial de coordinador"
      );
    }
  }
}
