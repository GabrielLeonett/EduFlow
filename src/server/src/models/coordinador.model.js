/**
 * @module CoordinadorModel
 * @description Modelo encargado exclusivamente de la interacción con la base de datos
 * para las operaciones relacionadas con los Coordinadores. Incluye asignación,
 * desasignación, listado, obtención, actualización y eliminación de coordinadores.
 */

// Importaciones principales
import db from "../database/db.js";
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

export default class CoordinadorModel {
  /**
   * @static
   * @async
   * @method asignarCoordinador
   * @description Asigna un profesor como coordinador de un PNF mediante un procedimiento almacenado
   */
  static async asignarCoordinador(datos, id_usuario) {
    try {
      const result = await db.raw(
        `CALL asignar_coordinador(?, ?, ?)`,
        [id_usuario, datos.id_profesor, datos.id_pnf]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
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
   */
  static async validarCoordinadorActivo(cedula_profesor) {
    try {
      console.log("🔍 [CoordinadorModel] Validando coordinador activo:", cedula_profesor);

      const coordinador = await db("coordinadores as c")
        .select(
          "c.id_coordinador",
          "c.id_profesor",
          "c.id_pnf",
          "p.nombre_pnf",
          "p.codigo_pnf",
          "u.nombres",
          "u.apellidos",
          "u.email",
          "c.activo",
          "c.created_at"
        )
        .join("pnfs as p", "c.id_pnf", "p.id_pnf")
        .join("users as u", "c.id_coordinador", "u.cedula")
        .where("c.id_profesor", cedula_profesor)
        .where("c.activo", true)
        .first();

      if (!coordinador) {
        return { existe: false, activo: false };
      }

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
   */
  static async obtenerCoordinadorPorPnf(id_pnf) {
    try {
      console.log("🔍 [CoordinadorModel] Buscando coordinador por PNF:", id_pnf);

      const coordinador = await db("coordinadores as c")
        .select(
          "c.id_coordinador",
          "c.id_profesor",
          "u.cedula",
          "u.nombres",
          "u.apellidos",
          "u.email",
          "c.activo",
          "c.created_at"
        )
        .join("users as u", "c.id_coordinador", "u.cedula")
        .where("c.id_pnf", id_pnf)
        .where("c.activo", true)
        .first();

      if (!coordinador) {
        console.log("✅ PNF sin coordinador activo");
        return null;
      }

      console.log("✅ Coordinador encontrado en PNF:", coordinador.nombres);

      return {
        id_coordinador: coordinador.id_coordinador,
        id_profesor: coordinador.id_profesor,
        cedula: coordinador.cedula,
        nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
        email: coordinador.email,
        activo: coordinador.activo,
        fecha_asignacion: coordinador.created_at,
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
   */
  static async obtenerDatosCoordinadorCompletos(cedula_coordinador) {
    try {
      console.log("🔍 [CoordinadorModel] Obteniendo datos completos del coordinador:", cedula_coordinador);

      // Para consultas complejas con JSON_AGG, es mejor usar raw
      const query = `
        SELECT 
          u.cedula,
          u.nombres,
          u.apellidos,
          u.email,
          u.telefono_movil,
          u.telefono_local,
          u.direccion,
          u.fecha_nacimiento,
          u.genero,
          c.id_coordinador,
          c.id_profesor,
          c.id_pnf,
          c.activo as coordinador_activo,
          p.nombre_pnf,
          p.codigo_pnf
        FROM coordinadores c
        INNER JOIN users u ON c.id_coordinador = u.cedula
        INNER JOIN pnfs p ON c.id_pnf = p.id_pnf
        WHERE c.id_coordinador = ? AND c.activo = true
      `;

      const result = await db.raw(query, [cedula_coordinador]);
      const coordinador = result.rows?.[0];

      if (!coordinador) {
        return FormatterResponseModel.respuestaPostgres(
          [],
          "Coordinador no encontrado"
        );
      }

      // Obtener datos adicionales del profesor
      const [areas, pregrados, posgrados, disponibilidad] = await Promise.all([
        this._obtenerAreasConocimiento(coordinador.id_profesor),
        this._obtenerFormacion(coordinador.id_profesor, 'pregrado'),
        this._obtenerFormacion(coordinador.id_profesor, 'posgrado'),
        this._obtenerDisponibilidad(coordinador.id_profesor),
      ]);

      const datosCompletos = {
        ...coordinador,
        areas_de_conocimiento: areas,
        pre_grados: pregrados,
        pos_grados: posgrados,
        disponibilidad: disponibilidad,
      };

      return FormatterResponseModel.respuestaPostgres(
        datosCompletos,
        "Datos del coordinador obtenidos correctamente"
      );
    } catch (error) {
      console.error("❌ Error al obtener datos completos del coordinador:", error);
      error.details = { path: "CoordinadorModel.obtenerDatosCoordinadorCompletos" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener datos del coordinador"
      );
    }
  }

  /**
   * Método auxiliar: Obtener áreas de conocimiento de un profesor
   * @private
   */
  static async _obtenerAreasConocimiento(id_profesor) {
    try {
      const areas = await db("areas_conocimiento as ac")
        .select("ac.nombre_area_conocimiento")
        .join("profesor_areas as pa", "ac.id_area_conocimiento", "pa.id_area_conocimiento")
        .where("pa.id_profesor", id_profesor);

      return areas.map(area => area.nombre_area_conocimiento);
    } catch (error) {
      console.error("Error al obtener áreas de conocimiento:", error);
      return [];
    }
  }

  /**
   * Método auxiliar: Obtener formación académica
   * @private
   */
  static async _obtenerFormacion(id_profesor, tipo) {
    try {
      const formacion = await db("formacion_profesor")
        .select("titulo", "institucion", "anno_graduacion")
        .where("id_profesor", id_profesor)
        .where("tipo_formacion", tipo);

      return formacion.map(item => ({
        titulo: item.titulo,
        institucion: item.institucion,
        anno_graduacion: item.anno_graduacion,
        completo: `${item.titulo} - ${item.institucion} (${item.anno_graduacion})`
      }));
    } catch (error) {
      console.error(`Error al obtener ${tipo}:`, error);
      return [];
    }
  }

  /**
   * Método auxiliar: Obtener disponibilidad
   * @private
   */
  static async _obtenerDisponibilidad(id_profesor) {
    try {
      const disponibilidad = await db("disponibilidad_docente")
        .select("dia_semana", "hora_inicio", "hora_fin")
        .where("id_profesor", id_profesor)
        .where("activo", true);

      return disponibilidad;
    } catch (error) {
      console.error("Error al obtener disponibilidad:", error);
      return [];
    }
  }

  /**
   * @static
   * @async
   * @method obtenerCoordinadoresActivos
   * @description Obtiene todos los coordinadores activos con información completa
   */
  static async obtenerCoordinadoresActivos() {
    try {
      console.log("🔍 [CoordinadorModel] Obteniendo coordinadores activos");

      const coordinadores = await db("coordinadores as c")
        .select(
          "c.id_coordinador",
          "c.id_profesor",
          "u.cedula",
          "u.nombres",
          "u.apellidos",
          "u.email",
          "p.id_pnf",
          "p.nombre_pnf",
          "p.codigo_pnf",
          "c.created_at"
        )
        .join("users as u", "c.id_coordinador", "u.cedula")
        .join("pnfs as p", "c.id_pnf", "p.id_pnf")
        .where("c.activo", true)
        .orderBy("u.nombres", "asc")
        .orderBy("u.apellidos", "asc");

      return FormatterResponseModel.respuestaPostgres(
        coordinadores,
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
   */
  static async reasignarCoordinador(datos, id_usuario) {
    try {
      const result = await db.raw(
        `CALL reasignar_coordinador(?, ?, ?)`,
        [id_usuario, datos.id_profesor, datos.id_pnf]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Coordinador reasignado correctamente"
      );
    } catch (error) {
      console.error("❌ Error al reasignar coordinador:", error);
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
   */
  static async obtenerTodos(queryParams = {}) {
    try {
      // Construir query con Knex
      let query = db("coordinadores_informacion_completa");

      // Aplicar filtros
      if (queryParams.estado !== undefined && queryParams.estado !== "") {
        const estadoBoolean = queryParams.estado === "true" || queryParams.estado === true;
        query = query.where("activo", estadoBoolean);
      }

      if (queryParams.cedula) {
        query = query.where("cedula", "ilike", `%${queryParams.cedula}%`);
      }

      if (queryParams.nombre) {
        query = query.where(function() {
          this.where("nombres", "ilike", `%${queryParams.nombre}%`)
            .orWhere("apellidos", "ilike", `%${queryParams.nombre}%`);
        });
      }

      if (queryParams.email) {
        query = query.where("email", "ilike", `%${queryParams.email}%`);
      }

      if (queryParams.pnf) {
        query = query.where("id_pnf", parseInt(queryParams.pnf));
      }

      // Aplicar ordenamiento
      if (queryParams.sort) {
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

        const sortField = allowedSortFields.includes(queryParams.sort.toLowerCase())
          ? queryParams.sort.toLowerCase()
          : "created_at";

        const sortOrder = queryParams.order?.toUpperCase() === "DESC" ? "desc" : "asc";
        
        query = query.orderBy(sortField, sortOrder);
      } else {
        query = query.orderBy("created_at", "desc");
      }

      // Aplicar paginación
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;
        
        query = query.limit(limit).offset(offset);
      }

      const coordinadores = await query;

      return FormatterResponseModel.respuestaPostgres(
        coordinadores,
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

  /**
   * @static
   * @async
   * @method listarCoordinadoresDestituidos
   */
  static async listarCoordinadoresDestituidos(queryParams = {}) {
    try {
      let query = db("coordinadores_destituidos_completos");

      // Aplicar filtros
      if (queryParams.id_pnf) {
        query = query.where("id_pnf", queryParams.id_pnf);
      }

      if (queryParams.nombre_pnf) {
        query = query.where("nombre_pnf", "ilike", `%${queryParams.nombre_pnf}%`);
      }

      if (queryParams.cedula) {
        query = query.where("cedula", queryParams.cedula);
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
        
        const sortOrder = queryParams.order?.toUpperCase() === "DESC" ? "desc" : "asc";
        
        query = query.orderBy(sortField, sortOrder);
      } else {
        query = query.orderBy("fecha_destitucion", "desc").orderBy("nombres", "asc");
      }

      // Aplicar paginación
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;
        
        query = query.limit(limit).offset(offset);
      }

      const coordinadoresDestituidos = await query;

      return FormatterResponseModel.respuestaPostgres(
        coordinadoresDestituidos,
        "Listado de coordinadores destituidos obtenido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.listarCoordinadoresDestituidos" };
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
   */
  static async obtenerCoordinador(cedula) {
    try {
      const coordinador = await db("coordinadores_informacion_completa")
        .where("cedula", cedula)
        .first();

      return FormatterResponseModel.respuestaPostgres(
        coordinador ? [coordinador] : [],
        coordinador ? "Coordinador obtenido correctamente" : "Coordinador no encontrado"
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
   */
  static async obtenerCoordinadorPorId(id_coordinador) {
    try {
      const coordinador = await db("coordinadores_informacion_completa")
        .where("id_coordinador", id_coordinador)
        .first();

      return FormatterResponseModel.respuestaPostgres(
        coordinador ? [coordinador] : [],
        coordinador ? "Coordinador obtenido correctamente" : "Coordinador no encontrado"
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
   */
  static async actualizarCoordinador(id_coordinador, datos, id_usuario) {
    try {
      // Campos permitidos para actualización
      const camposPermitidos = [
        "fecha_inicio",
        "fecha_fin",
        "observaciones",
        "estado",
        "motivo_destitucion",
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
          "No hay campos válidos para actualizar"
        );
      }

      // Agregar campos de auditoría
      datosActualizacion.fecha_actualizacion = db.fn.now();
      datosActualizacion.id_usuario_actualizacion = id_usuario;

      // Ejecutar actualización
      const result = await db("coordinadores")
        .where("id_coordinador", id_coordinador)
        .update(datosActualizacion);

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
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
      const result = await db.raw(
        `CALL eliminar_destituir_coordinador(NULL, ?, ?, ?, ?, ?, ?)`,
        [id_usuario, id_coordinador, tipo_accion, razon, observaciones, fecha_efectiva]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
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
      const result = await db.raw(
        `CALL reingresar_coordinador(NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_usuario, id_coordinador, tipo_reingreso, motivo_reingreso, observaciones, fecha_efectiva, registro_anterior_id, id_pnf]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
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
   */
  static async obtenerHistorialDestituciones(id_coordinador) {
    try {
      const historial = await db("destituciones as d")
        .select(
          "d.id_registro",
          "d.tipo_accion",
          "d.razon",
          "d.observaciones",
          "d.fecha_efectiva",
          "d.created_at",
          db.raw("u.nombres || ' ' || u.apellidos as usuario_accion_nombre")
        )
        .join("coordinadores as c", "d.usuario_id", "c.id_profesor")
        .join("users as u", "d.usuario_accion", "u.cedula")
        .where("c.id_coordinador", id_coordinador)
        .where("d.rol_id", 2)
        .orderBy("d.created_at", "desc");

      return FormatterResponseModel.respuestaPostgres(
        historial,
        "Historial obtenido correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.obtenerHistorialDestituciones" };
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
   */
  static async obtenerHistorialCoordinador(cedula_profesor) {
    try {
      const historial = await db("coordinadores_informacion_completa")
        .where("cedula", cedula_profesor)
        .orderBy("fecha_inicio", "desc");

      return FormatterResponseModel.respuestaPostgres(
        historial,
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

  /**
   * @static
   * @async
   * @method buscarCoordinadores
   * @description Busca coordinadores por término de búsqueda
   */
  static async buscarCoordinadores(termino) {
    try {
      const coordinadores = await db("coordinadores_informacion_completa")
        .where(function() {
          this.where("nombres", "ilike", `%${termino}%`)
            .orWhere("apellidos", "ilike", `%${termino}%`)
            .orWhere("cedula", "ilike", `%${termino}%`)
            .orWhere("email", "ilike", `%${termino}%`)
            .orWhere("nombre_pnf", "ilike", `%${termino}%`);
        })
        .orderBy("nombres", "asc")
        .limit(50);

      return FormatterResponseModel.respuestaPostgres(
        coordinadores,
        "Búsqueda de coordinadores completada"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.buscarCoordinadores" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al buscar coordinadores"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerEstadisticasCoordinadores
   * @description Obtiene estadísticas de coordinadores
   */
  static async obtenerEstadisticasCoordinadores() {
    try {
      const [total, activos, porPnf, sinCoordinador] = await Promise.all([
        db("coordinadores").count("* as total").first(),
        db("coordinadores").count("* as total").where("activo", true).first(),
        db("coordinadores as c")
          .select("p.nombre_pnf", db.raw("COUNT(*) as total"))
          .join("pnfs as p", "c.id_pnf", "p.id_pnf")
          .where("c.activo", true)
          .groupBy("p.nombre_pnf"),
        db("pnfs as p")
          .select("p.nombre_pnf")
          .leftJoin("coordinadores as c", function() {
            this.on("p.id_pnf", "c.id_pnf").andOn("c.activo", db.raw("?", [true]));
          })
          .whereNull("c.id_coordinador"),
      ]);

      const estadisticas = {
        total: parseInt(total.total),
        activos: parseInt(activos.total),
        porPnf,
        sinCoordinador: sinCoordinador.map(p => p.nombre_pnf),
        sinCoordinadorCount: sinCoordinador.length,
      };

      return FormatterResponseModel.respuestaPostgres(
        [estadisticas],
        "Estadísticas de coordinadores obtenidas correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.obtenerEstadisticasCoordinadores" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener estadísticas de coordinadores"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerCoordinadoresPorSede
   * @description Obtiene coordinadores agrupados por sede
   */
  static async obtenerCoordinadoresPorSede() {
    try {
      const coordinadores = await db("coordinadores_informacion_completa as cic")
        .select("s.nombre_sede", db.raw("JSON_AGG(JSON_BUILD_OBJECT('nombre', cic.nombres, 'apellidos', cic.apellidos, 'pnf', cic.nombre_pnf)) as coordinadores"))
        .join("pnfs as p", "cic.id_pnf", "p.id_pnf")
        .join("sedes as s", "p.id_sede", "s.id_sede")
        .where("cic.activo", true)
        .groupBy("s.nombre_sede")
        .orderBy("s.nombre_sede", "asc");

      return FormatterResponseModel.respuestaPostgres(
        coordinadores,
        "Coordinadores por sede obtenidos correctamente"
      );
    } catch (error) {
      error.details = { path: "CoordinadorModel.obtenerCoordinadoresPorSede" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener coordinadores por sede"
      );
    }
  }

  /**
   * @static
   * @async
   * @method verificarDisponibilidadCoordinador
   * @description Verifica si un profesor puede ser coordinador
   */
  static async verificarDisponibilidadCoordinador(id_profesor) {
    try {
      const [coordinadorActivo, cargaHoraria] = await Promise.all([
        db("coordinadores")
          .where("id_profesor", id_profesor)
          .where("activo", true)
          .first(),
        db("horarios")
          .where("id_profesor", id_profesor)
          .count("* as total_horas")
          .first(),
      ]);

      return {
        puedeSerCoordinador: !coordinadorActivo,
        coordinadorActivo: coordinadorActivo ? {
          id_pnf: coordinadorActivo.id_pnf,
          fecha_designacion: coordinadorActivo.created_at
        } : null,
        cargaHoraria: parseInt(cargaHoraria.total_horas || 0),
        recomendacion: !coordinadorActivo && (parseInt(cargaHoraria.total_horas || 0) < 20)
          ? "Apto para coordinación"
          : "No recomendado (carga horaria alta o ya es coordinador)"
      };
    } catch (error) {
      console.error("Error al verificar disponibilidad:", error);
      throw error;
    }
  }
}