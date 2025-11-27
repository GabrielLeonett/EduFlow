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
   * @method validarCoordinadorActivo
   * @description Valida si un coordinador existe y está activo
   * @param {number} cedula_profesor - Cédula del coordinador
   * @returns {Promise<Object>} Información del coordinador
   */
  static async validarCoordinadorActivo(cedula_profesor) {
    try {
      console.log(
        "🔍 [CoordinadorModel] Validando coordinador activo:",
        cedula_profesor
      );

      const query = `
      SELECT 
        c.id_coordinador,
        c.id_profesor,
        c.id_pnf,
        p.nombre_pnf,
        p.codigo_pnf,
        u.nombres,
        u.apellidos,
        u.email,
        c.activo,
        c.created_at
      FROM coordinadores c
      INNER JOIN pnfs p ON c.id_pnf = p.id_pnf
      INNER JOIN users u ON c.id_coordinador = u.cedula
      WHERE c.id_profesor = $1 AND c.activo = true
    `;

      const { rows } = await pg.query(query, [cedula_profesor]);

      console.log(rows);
      const coordinador = rows[0];

      return {
        existe: true,
        activo: coordinador.activo,
        id_coordinador: coordinador.id_coordinador,
        id_profesor: coordinador.id_profesor,
        pnf_actual: coordinador.id_pnf,
        pnf_nombre_actual: coordinador.nombre_pnf,
        pnf_codigo_actual: coordinador.codigo_pnf,
        nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
        email: coordinador.email,
        fecha_designacion: coordinador.fecha_designacion,
        datos_completos: coordinador,
      };
    } catch (error) {
      console.error("❌ Error al validar coordinador activo:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerCoordinadorPorPnf
   * @description Obtiene el coordinador activo de un PNF específico
   * @param {number} id_pnf - ID del PNF
   * @returns {Promise<Object>} Información del coordinador
   */
  static async obtenerCoordinadorPorPnf(id_pnf) {
    try {
      console.log(
        "🔍 [CoordinadorModel] Buscando coordinador por PNF:",
        id_pnf
      );

      const query = `
      SELECT 
        c.id_coordinador,
        c.id_profesor,
        u.cedula,
        u.nombres,
        u.apellidos,
        u.email,
        c.activo,
        c.created_at
      FROM coordinadores c
      INNER JOIN users u ON c.id_coordinador = u.cedula
      WHERE c.id_pnf = $1 AND c.activo = true
    `;

      const { rows } = await pg.query(query, [id_pnf]);

      if (rows.length === 0) {
        console.log("✅ PNF sin coordinador activo");
        return null;
      }

      const coordinador = rows[0];
      console.log("✅ Coordinador encontrado en PNF:", coordinador.nombres);

      return {
        id_coordinador: coordinador.id_coordinador,
        id_profesor: coordinador.id_profesor,
        cedula: coordinador.cedula,
        nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
        email: coordinador.email,
        activo: coordinador.activo,
        fecha_asignacion: coordinador.created_at,
        fecha_designacion: coordinador.fecha_designacion,
      };
    } catch (error) {
      console.error("❌ Error al obtener coordinador por PNF:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerDatosCoordinadorCompletos
   * @description Obtiene todos los datos de un coordinador incluyendo información personal y profesional
   * @param {number} cedula_coordinador - Cédula del coordinador
   * @returns {Promise<Object>} Datos completos del coordinador
   */
  static async obtenerDatosCoordinadorCompletos(cedula_coordinador) {
    try {
      console.log(
        "🔍 [CoordinadorModel] Obteniendo datos completos del coordinador:",
        cedula_coordinador
      );

      const query = `
      SELECT 
        -- Datos de usuario
        u.cedula,
        u.nombres,
        u.apellidos,
        u.email,
        u.telefono_movil,
        u.telefono_local,
        u.direccion,
        u.fecha_nacimiento,
        u.genero,
        
        -- Datos de coordinador
        c.id_coordinador,
        c.id_profesor,
        c.id_pnf,
        c.activo as coordinador_activo,
        c.fecha_designacion,
        c.created_at as fecha_asignacion,
        
        -- Datos del PNF
        p.nombre_pnf,
        p.codigo_pnf,
        p.descripcion as pnf_descripcion,
        
        -- Datos del profesor
        pr.categoria,
        pr.dedicacion,
        pr.fecha_ingreso,
        pr.estatus as estatus_profesor,
        
        -- Áreas de conocimiento
        (
          SELECT JSON_AGG(ac.nombre_area)
          FROM areas_conocimiento ac
          INNER JOIN profesor_areas pa ON ac.id_area = pa.id_area
          WHERE pa.id_profesor = pr.id_profesor
        ) as areas_de_conocimiento,
        
        -- Formación académica (pregrados)
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'titulo', fp.titulo,
              'institucion', fp.institucion,
              'anno_graduacion', fp.anno_graduacion,
              'completo', fp.titulo || ' - ' || fp.institucion || ' (' || fp.anno_graduacion || ')'
            )
          )
          FROM formacion_profesor fp
          WHERE fp.id_profesor = pr.id_profesor AND fp.tipo_formacion = 'pregrado'
        ) as pre_grados,
        
        -- Formación académica (posgrados)
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'titulo', fp.titulo,
              'institucion', fp.institucion,
              'anno_graduacion', fp.anno_graduacion,
              'completo', fp.titulo || ' - ' || fp.institucion || ' (' || fp.anno_graduacion || ')'
            )
          )
          FROM formacion_profesor fp
          WHERE fp.id_profesor = pr.id_profesor AND fp.tipo_formacion = 'posgrado'
        ) as pos_grados,
        
        -- Disponibilidad
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'dia_semana', dd.dia_semana,
              'hora_inicio', dd.hora_inicio,
              'hora_fin', dd.hora_fin
            )
          )
          FROM disponibilidad_docente dd
          WHERE dd.id_profesor = pr.id_profesor AND dd.activo = true
        ) as disponibilidad,
        
        -- Horas disponibles
        (
          SELECT JSON_BUILD_OBJECT(
            'hours', COALESCE(SUM(EXTRACT(HOUR FROM (dd.hora_fin - dd.hora_inicio))), 0),
            'minutes', COALESCE(SUM(EXTRACT(MINUTE FROM (dd.hora_fin - dd.hora_inicio))), 0)
          )
          FROM disponibilidad_docente dd
          WHERE dd.id_profesor = pr.id_profesor AND dd.activo = true
        ) as horas_disponibles

      FROM coordinadores c
      INNER JOIN users u ON c.id_coordinador = u.cedula
      INNER JOIN pnfs p ON c.id_pnf = p.id_pnf
      INNER JOIN profesores pr ON c.id_profesor = pr.id_profesor
      WHERE c.id_coordinador = $1 AND c.activo = true
    `;

      const { rows } = await pg.query(query, [cedula_coordinador]);

      if (rows.length === 0) {
        return FormatterResponseModel.respuestaPostgres(
          [],
          "Coordinador no encontrado"
        );
      }

      return FormatterResponseModel.respuestaPostgres(
        rows[0],
        "Datos del coordinador obtenidos correctamente"
      );
    } catch (error) {
      console.error(
        "❌ Error al obtener datos completos del coordinador:",
        error
      );
      error.details = {
        path: "CoordinadorModel.obtenerDatosCoordinadorCompletos",
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener datos del coordinador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerCoordinadoresActivos
   * @description Obtiene todos los coordinadores activos con información completa
   * @returns {Promise<Object>} Lista de coordinadores activos
   */
  static async obtenerCoordinadoresActivos() {
    try {
      console.log("🔍 [CoordinadorModel] Obteniendo coordinadores activos");

      const query = `
      SELECT 
        c.id_coordinador,
        c.id_profesor,
        u.cedula,
        u.nombres,
        u.apellidos,
        u.email,
        p.id_pnf,
        p.nombre_pnf,
        p.codigo_pnf,
        c.created_at
      FROM coordinadores c
      INNER JOIN users u ON c.id_coordinador = u.cedula
      INNER JOIN pnfs p ON c.id_pnf = p.id_pnf
      WHERE c.activo = true
      ORDER BY u.nombres, u.apellidos
    `;

      const { rows } = await pg.query(query);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinadores activos obtenidos correctamente"
      );
    } catch (error) {
      console.error("❌ Error al obtener coordinadores activos:", error);
      error.details = { path: "CoordinadorModel.obtenerCoordinadoresActivos" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener coordinadores activos"
      );
    }
  }

  /**
   * @static
   * @async
   * @method reasignarCoordinador
   * @description Reasigna un coordinador existente a otro PNF mediante un procedimiento almacenado
   * @param {Object} datos - Datos de reasignación del coordinador
   * @param {number} id_usuario - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async reasignarCoordinador(datos, id_usuario) {
    try {
      const query = `CALL reasignar_coordinador($1, $2, $3)`;
      const params = [id_usuario, datos.id_profesor, datos.id_pnf];
      console.log("📋 Parámetros reasignación:", params);

      const { rows } = await pg.query(query, params);
      console.log(rows);
      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinador reasignado correctamente"
      );
    } catch (error) {
      console.log(error);
      error.details = { path: "CoordinadorModel.reasignarCoordinador" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al reasignar coordinador"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerTodos
   * @description Obtener todos los coordinadores con soporte para parámetros de consulta
   * @param {Object} queryParams - Parámetros de consulta (paginación, filtros, ordenamiento)
   * @returns {Promise<Object>} Lista de coordinadores
   */
  static async obtenerTodos(queryParams = {}) {
    try {
      let query = `
      SELECT 
        id_coordinador,
        id_profesor,
        id_pnf,
        activo,
        created_at,
        updated_at,
        fecha_desasignacion,
        nombres,
        apellidos,
        email,
        nombre_pnf
      FROM public.vista_coordinadores_completa 
      WHERE 1=1
    `;
      const params = [];

      // --- 1. Aplicar Filtros ---

      // Filtro por Estado (activo/inactivo)
      if (queryParams.estado !== undefined && queryParams.estado !== "") {
        query += ` AND activo = ?`;
        params.push(
          queryParams.estado === "true" || queryParams.estado === true
        );
      }

      // Filtro por Cédula (búsqueda parcial)
      if (queryParams.cedula) {
        query += ` AND id_coordinador::text LIKE ?`;
        params.push(`%${queryParams.cedula}%`);
      }

      // Filtro por Nombre (búsqueda parcial)
      if (queryParams.nombre) {
        query += ` AND (nombres ILIKE ? OR apellidos ILIKE ?)`;
        params.push(`%${queryParams.nombre}%`, `%${queryParams.nombre}%`);
      }

      // Filtro por Email (búsqueda parcial)
      if (queryParams.email) {
        query += ` AND email ILIKE ?`;
        params.push(`%${queryParams.email}%`);
      }

      // Filtro por PNF
      if (queryParams.pnf) {
        query += ` AND id_pnf = ?`;
        params.push(parseInt(queryParams.pnf));
      }

      // --- 2. Aplicar Ordenamiento ---

      if (queryParams.sort) {
        // Campos permitidos para ordenar
        const allowedSortFields = [
          "id_coordinador",
          "nombres",
          "apellidos",
          "email",
          "activo",
          "nombre_pnf",
          "created_at",
          "updated_at",
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

        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
      }

      // 🚀 Ejecutar la consulta con parámetros
      const { rows } = await pg.query(query, params);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Coordinadores obtenidos exitosamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.obtenerTodos" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener los coordinadores"
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
