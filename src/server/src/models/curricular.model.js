// ===========================================================
// Importación de dependencias
// ===========================================================
import db from "../database/db.js"; // Cambiar a knex
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class CurricularModel
 * @description Modelo para gestionar las operaciones relacionadas con
 * Programas Nacionales de Formación (PNF), Unidades Curriculares,
 * Trayectos y Secciones en la base de datos.
 * Utiliza Knex para todas las operaciones con la base de datos.
 */
export default class CurricularModel {
  // ===========================================================
  // MÉTODOS DE REGISTRO
  // ===========================================================

  /**
   * @static
   * @async
   * @method registrarPNF
   * @description Registra un nuevo Programa Nacional de Formación (PNF)
   */
  static async registrarPNF(datos, usuario_accion) {
    try {
      console.log("Datos para registrar PNF:", datos);
      const {
        nombre_pnf,
        descripcion_pnf,
        codigo_pnf,
        duracion_trayectos_pnf,
        sede_pnf,
      } = datos;

      // Usar Knex.raw para procedimientos almacenados
      const result = await db.raw(
        `CALL public.registrar_pnf_completo(?, ?, ?, ?, ?, ?, NULL)`,
        [
          usuario_accion,
          nombre_pnf,
          descripcion_pnf,
          codigo_pnf,
          sede_pnf,
          duracion_trayectos_pnf,
        ]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "PNF registrado exitosamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.registrarPNF" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al registrar el PNF"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizarPNF
   * @description Actualizar un PNF existente usando el procedimiento almacenado
   */
  static async actualizarPNF(idPNF, datos, usuarioId) {
    try {
      const query = `
        CALL actualizar_pnf_completo_o_parcial(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;

      const valores = [
        null, // p_resultado (OUT parameter)
        usuarioId,
        idPNF,
        datos.codigo_pnf || null,
        datos.nombre_pnf || null,
        datos.descripcion_pnf || null,
        datos.duracion_trayectos || null,
        datos.poblacion_estudiantil_pnf || null,
        datos.id_sede || null,
        datos.activo || null,
      ];

      console.log(query, valores)

      const result = await db.raw(query, valores);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "PNF actualizado exitosamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.actualizarPNF" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar el PNF"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizarDescripcionTrayecto
   */
  static async actualizarDescripcionTrayecto(
    idTrayecto,
    descripcion,
    usuarioId
  ) {
    try {
      console.log("📊 [Model] Actualizando descripción del trayecto:", {
        idTrayecto,
        usuarioId,
      });

      const result = await db.raw(
        `CALL actualizar_descripcion_trayecto(?, ?, ?, ?)`,
        [null, usuarioId, idTrayecto, descripcion]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Descripción de trayecto actualizada exitosamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.actualizarDescripcionTrayecto" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar la descripción del trayecto"
      );
    }
  }

  /**
   * @static
   * @async
   * @method registrarUnidadCurricular
   */
  static async registrarUnidadCurricular(idTrayecto, datos, usuario_accion) {
    try {
      console.log("Datos para registrar Unidad Curricular:", datos);
      const {
        nombre_unidad_curricular,
        codigo_unidad_curricular,
        tipo_unidad,
        descripcion_unidad_curricular,
        carga_horas_academicas,
        creditos,
        semanas,
        areas_conocimiento = [],
        lineas_investigacion = [],
        sinoptico = null,
        id_linea_investigacion = null,
        hte = 0,
        hse = 0,
        hta = 0,
        hsa = 0,
        hti = 0,
        hsi = 0,
      } = datos;

      // Validaciones
      if (!Array.isArray(areas_conocimiento)) {
        throw new Error("El parámetro areas_conocimiento debe ser un array");
      }
      if (!Array.isArray(lineas_investigacion)) {
        throw new Error("El parámetro lineas_investigacion debe ser un array");
      }

      // Convertir arrays
      const areasConocimientoArray = areas_conocimiento.map((area) =>
        Number(area.id_area_conocimiento || area)
      );

      const lineasInvestigacionArray = lineas_investigacion.map((linea) =>
        Number(linea.id_linea_investigacion || linea)
      );

      const lineasInvestigacionParam =
        lineasInvestigacionArray.length > 0 ? lineasInvestigacionArray : null;

      // Query con Knex.raw
      const query = `
        CALL registrar_unidad_curricular_completo(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;

      const params = [
        usuario_accion,
        idTrayecto,
        nombre_unidad_curricular,
        descripcion_unidad_curricular,
        carga_horas_academicas,
        codigo_unidad_curricular,
        areasConocimientoArray,
        lineasInvestigacionParam,
        sinoptico,
        id_linea_investigacion,
        creditos,
        semanas,
        tipo_unidad,
        hte,
        hse,
        hta,
        hsa,
        hti,
        hsi,
        null, // Para el parámetro OUT
      ];

      console.log("Parámetros para el procedimiento:", params);

      const result = await db.raw(query, params);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Unidad Curricular registrada exitosamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.registrarUnidadCurricular" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al registrar la Unidad Curricular"
      );
    }
  }

  /**
   * @static
   * @async
   * @method registrarLineasInvestigacion
   */
  static async registrarLineasInvestigacion(datos, usuario_accion) {
    try {
      const {
        nombre_linea_investigacion,
        descripcion = null,
        id_trayecto = null,
      } = datos;

      const result = await db.raw(
        `CALL public.registrar_linea_investigacion(?, ?, ?, ?, NULL)`,
        [usuario_accion, nombre_linea_investigacion, descripcion, id_trayecto]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Línea de investigación registrada exitosamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.registrarLineasInvestigacion" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al registrar la Línea de Investigación"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarLineasInvestigacion
   */
  static async mostrarLineasInvestigacion(id_trayecto = null) {
    try {
      let rows;

      if (id_trayecto) {
        rows = await db("lineas_investigacion as li")
          .select(
            "li.id_linea_investigacion",
            "li.nombre_linea_investigacion",
            "li.descripcion",
            "li.activo",
            "li.id_pnf",
            "li.created_at",
            "li.updated_at",
            "t.id_trayecto",
            "p.nombre_pnf"
          )
          .leftJoin("trayectos as t", "li.id_pnf", "t.id_pnf")
          .leftJoin("pnfs as p", "li.id_pnf", "p.id_pnf")
          .where("t.id_trayecto", id_trayecto)
          .orderBy("li.nombre_linea_investigacion");
      } else {
        rows = await db("lineas_investigacion as li")
          .select(
            "li.id_linea_investigacion",
            "li.nombre_linea_investigacion",
            "li.descripcion",
            "li.activo",
            "li.id_pnf",
            "li.created_at",
            "li.updated_at",
            "p.nombre_pnf"
          )
          .leftJoin("pnfs as p", "li.id_pnf", "p.id_pnf")
          .orderBy("li.nombre_linea_investigacion");
      }

      return FormatterResponseModel.respuestaPostgres(
        rows,
        id_trayecto
          ? "Líneas de investigación obtenidas exitosamente para el trayecto especificado"
          : "Todas las líneas de investigación obtenidas exitosamente"
      );
    } catch (error) {
      error.details = { path: "CurricularModel.mostrarLineasInvestigacion" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener las líneas de investigación"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizarUnidadCurricular
   */
  static async actualizarUnidadCurricular(
    id_unidad_curricular,
    datos,
    usuarioId
  ) {
    try {
      console.log("📊 [Model] Actualizando unidad curricular:", {
        id_unidad_curricular,
        datos,
        usuarioId,
      });

      // Extraer datos
      const {
        id_trayecto,
        codigo_unidad_curricular,
        nombre_unidad_curricular,
        descripcion_unidad_curricular,
        carga_horas_academicas,
        activo,
        areas_conocimiento,
        lineas_investigacion,
        tipo_unidad,
        creditos,
        semanas,
        sinoptico,
        hte,
        hse,
        hta,
        hsa,
        hti,
        hsi,
      } = datos;

      // Validaciones
      if (areas_conocimiento && !Array.isArray(areas_conocimiento)) {
        throw new Error("El parámetro areas_conocimiento debe ser un array");
      }
      if (lineas_investigacion && !Array.isArray(lineas_investigacion)) {
        throw new Error("El parámetro lineas_investigacion debe ser un array");
      }

      // Convertir arrays
      const areasConocimientoArray = areas_conocimiento
        ? areas_conocimiento.map((area) =>
            Number(area.id_area_conocimiento || area)
          )
        : null;

      const lineasInvestigacionArray = lineas_investigacion
        ? lineas_investigacion.map((linea) =>
            Number(linea.id_linea_investigacion || linea)
          )
        : null;

      // Usar Knex.raw para procedimiento almacenado
      const query = `
        CALL actualizar_unidad_curricular_completo(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;

      const valores = [
        null, // p_resultado (OUT)
        usuarioId,
        id_unidad_curricular,
        id_trayecto || null,
        codigo_unidad_curricular || null,
        nombre_unidad_curricular || null,
        descripcion_unidad_curricular || null,
        carga_horas_academicas !== undefined
          ? Number(carga_horas_academicas)
          : null,
        activo !== undefined ? Boolean(activo) : null,
        areasConocimientoArray,
        lineasInvestigacionArray,
        tipo_unidad || null,
        creditos !== undefined ? Number(creditos) : null,
        semanas !== undefined ? Number(semanas) : null,
        sinoptico || null,
        hte !== undefined ? Number(hte) : null,
        hse !== undefined ? Number(hse) : null,
        hta !== undefined ? Number(hta) : null,
        hsa !== undefined ? Number(hsa) : null,
        hti !== undefined ? Number(hti) : null,
        hsi !== undefined ? Number(hsi) : null,
      ];

      const result = await db.raw(query, valores);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Unidad Curricular actualizada exitosamente."
      );
    } catch (error) {
      console.error("💥 Error en modelo actualizar unidad curricular:", error);
      error.details = {
        path: "CurricularModel.actualizarUnidadCurricular",
        id_unidad_curricular,
        usuarioId,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al actualizar la Unidad Curricular"
      );
    }
  }

  // ===========================================================
  // MÉTODOS DE CONSULTA
  // ===========================================================

  /**
   * @static
   * @async
   * @method mostrarPNF
   */
  static async mostrarPNF(filters = {}) {
    try {
      // Construir query con Knex
      let query = db("vista_pnfs");

      // Aplicar filtros dinámicos
      if (filters.id_sede) {
        query = query.where("id_sede", filters.id_sede);
      }

      if (filters.activo !== undefined) {
        query = query.where("activo", filters.activo);
      }

      if (filters.tiene_coordinador !== undefined) {
        if (filters.tiene_coordinador) {
          query = query.whereExists(function () {
            this.select(db.raw("1"))
              .from("coordinadores as c")
              .whereRaw("c.id_pnf = vista_pnfs.id_pnf");
          });
        } else {
          query = query.whereNotExists(function () {
            this.select(db.raw("1"))
              .from("coordinadores as c")
              .whereRaw("c.id_pnf = vista_pnfs.id_pnf");
          });
        }
      }

      if (filters.search) {
        query = query.where(function () {
          this.where("nombre_pnf", "ilike", `%${filters.search}%`).orWhere(
            "codigo_pnf",
            "ilike",
            `%${filters.search}%`
          );
        });
      }

      if (filters.searchID) {
        query = query.where("id_pnf", filters.searchID);
      }

      // Ordenar y ejecutar
      const rows = await query.orderBy("nombre_pnf", "asc");

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Listado de PNFs obtenidos exitosamente."
      );
    } catch (error) {
      error.details = {
        path: "CurricularModel.mostrarPNF",
        filters: filters,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener los PNFs"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarTrayectos
   */
  static async mostrarTrayectos(codigo_pnf) {
    try {
      let rows;

      if (codigo_pnf) {
        rows = await db("trayectos as t")
          .select(
            "t.id_trayecto",
            "t.poblacion_estudiantil",
            "t.valor_trayecto",
            "t.descripcion_trayecto",
            "p.nombre_pnf",
            "p.id_pnf",
            "p.codigo_pnf"
          )
          .join("pnfs as p", "t.id_pnf", "p.id_pnf")
          .where("p.codigo_pnf", codigo_pnf)
          .where("t.activo", true)
          .where("p.activo", true)
          .orderBy("t.valor_trayecto", "asc");
      } else {
        rows = await db("trayectos as t")
          .select(
            "t.id_trayecto",
            "t.poblacion_estudiantil",
            "t.valor_trayecto",
            "t.descripcion_trayecto",
            "p.nombre_pnf",
            "p.id_pnf",
            "p.codigo_pnf"
          )
          .join("pnfs as p", "t.id_pnf", "p.id_pnf")
          .where("t.activo", true)
          .where("p.activo", true)
          .orderBy("p.nombre_pnf", "asc")
          .orderBy("t.valor_trayecto", "asc");
      }

      console.log("📊 [Model] Trayectos obtenidos:", rows.length);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Trayectos obtenidos correctamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.mostrarTrayectos" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener los trayectos"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarSeccionesByPnfAndValueTrayecto
   */
  static async mostrarSeccionesByPnfAndValueTrayecto(
    codigo_pnf,
    valorTrayecto
  ) {
    try {
      console.log("📊 [Model] Obteniendo secciones...", {
        codigo_pnf,
        valorTrayecto,
      });

      const rows = await db("secciones as s")
        .select(
          "s.id_seccion",
          "s.valor_seccion",
          "s.cupos_disponibles",
          "t.nombre_turno",
          "s.id_trayecto",
          "tr.valor_trayecto as trayecto_valor",
          "p.codigo_pnf",
          "p.nombre_pnf"
        )
        .leftJoin("turnos as t", "s.id_turno", "t.id_turno")
        .join("trayectos as tr", "s.id_trayecto", "tr.id_trayecto")
        .join("pnfs as p", "tr.id_pnf", "p.id_pnf")
        .where("p.codigo_pnf", codigo_pnf)
        .where("tr.valor_trayecto", valorTrayecto)
        .orderBy("s.valor_seccion", "asc");

      console.log(`📊 [Model] ${rows.length} secciones obtenidas`);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Secciones obtenidas correctamente."
      );
    } catch (error) {
      console.error("❌ Error en modelo mostrar secciones:", error);
      error.details = {
        path: "CurricularModel.mostrarSeccionesByPnfAndValueTrayecto",
        codigo_pnf,
        valorTrayecto,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener las secciones"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarSeccionesByPnfAndValueUnidadCurricular
   */
  static async mostrarSeccionesByPnfAndValueUnidadCurricular(
    codigo_pnf,
    valorTrayecto
  ) {
    try {
      console.log("📊 [Model] Obteniendo unidades curriculares...", {
        codigo_pnf,
        valorTrayecto,
      });

      const rows = await db("unidades_curriculares as uc")
        .select(
          "uc.nombre_unidad_curricular",
          "uc.codigo_unidad",
          "uc.horas_clase",
          "uc.descripcion_unidad_curricular",
          "tr.valor_trayecto as trayecto_valor",
          "p.codigo_pnf",
          "p.nombre_pnf"
        )
        .join("trayectos as tr", "uc.id_trayecto", "tr.id_trayecto")
        .join("pnfs as p", "tr.id_pnf", "p.id_pnf")
        .where("p.codigo_pnf", codigo_pnf)
        .where("tr.valor_trayecto", valorTrayecto)
        .orderBy("uc.id_unidad_curricular", "asc");

      console.log(`📊 [Model] ${rows.length} unidades curriculares obtenidas`);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Unidades curriculares obtenidas correctamente."
      );
    } catch (error) {
      console.error("❌ Error en modelo mostrar unidades curriculares:", error);
      error.details = {
        path: "CurricularModel.mostrarSeccionesByPnfAndValueUnidadCurricular",
        codigo_pnf,
        valorTrayecto,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener las unidades curriculares"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarSecciones
   */
  static async mostrarSecciones(trayecto) {
    try {
      const rows = await db("secciones as s")
        .select(
          "s.id_seccion",
          "s.valor_seccion",
          "s.cupos_disponibles",
          "t.nombre_turno",
          "s.id_trayecto"
        )
        .leftJoin("turnos as t", "s.id_turno", "t.id_turno")
        .where("s.id_trayecto", trayecto)
        .orderBy("s.valor_seccion", "asc");

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Secciones obtenidas correctamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.mostrarSecciones" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener las secciones"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarUnidadesCurriculares
   */
  static async mostrarUnidadesCurriculares(trayecto) {
    try {
      // Para vistas, podemos usar raw o construir la query
      const rows = await db("vista_unidades_con_areas")
        .where("id_trayecto", trayecto)
        .orderBy("nombre_unidad_curricular", "asc");

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Unidades curriculares obtenidas correctamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.mostrarUnidadesCurriculares" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener las unidades curriculares"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerUnidadCurricularPorId
   */
  static async obtenerUnidadCurricularPorId(id) {
    try {
      const rows = await db("vista_unidades_con_areas")
        .where("id_unidad_curricular", id)
        .first(); // Usar first() para obtener un solo registro

      return FormatterResponseModel.respuestaPostgres(
        rows ? [rows] : [], // Mantener compatibilidad con array
        rows
          ? "Unidad curricular obtenida correctamente."
          : "Unidad curricular no encontrada."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.obtenerUnidadCurricularPorId" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener la unidad curricular"
      );
    }
  }

  /**
   * @static
   * @async
   * @method eliminarUnidadCurricular
   */
  static async eliminarUnidadCurricular(id_usuario, id_unidad_curricular) {
    try {
      const result = await db.raw(
        `CALL eliminar_unidad_curricular_fisicamente(?, ?, NULL)`,
        [id_usuario, id_unidad_curricular]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Unidad curricular eliminada correctamente."
      );
    } catch (error) {
      error.details = {
        path: "CurricularModel.eliminarUnidadCurricular",
        id_usuario: id_usuario,
        id_unidad_curricular: id_unidad_curricular,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al eliminar la unidad curricular"
      );
    }
  }

  /**
   * @static
   * @async
   * @method eliminarPnf
   */
  static async eliminarPnf(id_usuario, id_pnf) {
    try {
      const result = await db.raw(`CALL eliminar_pnf(?, ?, NULL)`, [
        id_usuario,
        id_pnf,
      ]);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "PNF eliminado correctamente."
      );
    } catch (error) {
      error.details = {
        path: "CurricularModel.eliminarPnf",
        id_usuario: id_usuario,
        id_pnf: id_pnf,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al eliminar el PNF"
      );
    }
  }

  /**
   * @static
   * @async
   * @method reactivarPnf
   */
  static async reactivarPnf(id_usuario, id_pnf) {
    try {
      const result = await db.raw(`CALL reactivar_pnf(?, ?, NULL)`, [
        id_usuario,
        id_pnf,
      ]);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "PNF reactivado correctamente."
      );
    } catch (error) {
      error.details = {
        path: "CurricularModel.reactivarPnf",
        id_usuario: id_usuario,
        id_pnf: id_pnf,
      };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al reactivar el PNF"
      );
    }
  }

  // ===========================================================
  // MÉTODOS DE ASIGNACIÓN Y GESTIÓN
  // ===========================================================

  /**
   * @static
   * @async
   * @method CrearSecciones
   */
  static async CrearSecciones(idTrayecto, datos) {
    try {
      const { poblacionEstudiantil } = datos;

      const result = await db.raw(
        `CALL public.distribuir_estudiantes_secciones(?, ?, NULL)`,
        [idTrayecto, poblacionEstudiantil]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        `Secciones creadas correctamente para el trayecto ${idTrayecto}.`
      );
    } catch (error) {
      error.details = { path: "CurricularModel.CrearSecciones" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al crear las secciones"
      );
    }
  }

  /**
   * @static
   * @async
   * @method asignacionTurnoSeccion
   */
  static async asignacionTurnoSeccion(idSeccion, idTurno, usuario_accion) {
    try {
      console.log(
        "idSeccion:",
        idSeccion,
        "idTurno:",
        idTurno,
        "usuario_accion:",
        usuario_accion.id
      );

      const result = await db.raw(
        `CALL public.asignar_turno_seccion(?, ?, ?, NULL)`,
        [usuario_accion.id, idSeccion, idTurno]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Turno asignado correctamente a la sección."
      );
    } catch (error) {
      console.log(error);
      error.details = { path: "CurricularModel.asignacionTurnoSeccion" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al asignar el turno a la sección"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarTurnos
   */
  static async mostrarTurnos() {
    try {
      const rows = await db("turnos")
        .select("id_turno", "nombre_turno", "descripcion_turno")
        .orderBy("id_turno", "asc");

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Turnos obtenidos correctamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.mostrarTurnos" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener los turnos"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerTrayectoPorId
   * @description Obtiene un trayecto por su ID
   * @param {number} id_trayecto - ID del trayecto
   * @returns {Promise<Object>} Datos del trayecto
   */
  static async obtenerTrayectoPorId(id_trayecto) {
    try {
      const trayecto = await db("trayectos as t")
        .select(
          "t.id_trayecto",
          "t.poblacion_estudiantil",
          "t.valor_trayecto",
          "t.descripcion_trayecto",
          "t.activo",
          "p.id_pnf",
          "p.nombre_pnf",
          "p.codigo_pnf"
        )
        .join("pnfs as p", "t.id_pnf", "p.id_pnf")
        .where("t.id_trayecto", id_trayecto)
        .first();

      return FormatterResponseModel.respuestaPostgres(
        trayecto ? [trayecto] : [],
        trayecto
          ? "Trayecto obtenido correctamente."
          : "Trayecto no encontrado."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.obtenerTrayectoPorId" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener el trayecto"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerPNFPorId
   * @description Obtiene un PNF por su ID
   * @param {number} id_pnf - ID del PNF
   * @returns {Promise<Object>} Datos del PNF
   */
  static async obtenerPNFPorId(id_pnf) {
    try {
      const pnf = await db("pnfs")
        .where("id_pnf", id_pnf)
        .first();

      return FormatterResponseModel.respuestaPostgres(
        pnf ? [pnf] : [],
        pnf ? "PNF obtenido correctamente." : "PNF no encontrado."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.obtenerPNFPorId" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener el PNF"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscarUnidadesCurriculares
   * @description Busca unidades curriculares por término
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Object>} Resultados de búsqueda
   */
  static async buscarUnidadesCurriculares(termino) {
    try {
      const rows = await db("vista_unidades_con_areas")
        .where("nombre_unidad_curricular", "ilike", `%${termino}%`)
        .orWhere("codigo_unidad", "ilike", `%${termino}%`)
        .limit(50)
        .orderBy("nombre_unidad_curricular", "asc");

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Búsqueda de unidades curriculares completada."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.buscarUnidadesCurriculares" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al buscar unidades curriculares"
      );
    }
  }

  /**
   * @static
   * @async
   * @method contarEstadisticas
   * @description Obtiene estadísticas generales
   * @returns {Promise<Object>} Estadísticas
   */
  static async contarEstadisticas() {
    try {
      const [pnfsCount, trayectosCount, unidadesCount, lineasCount] =
        await Promise.all([
          db("pnfs").count("* as total").where("activo", true),
          db("trayectos").count("* as total").where("activo", true),
          db("unidades_curriculares").count("* as total"),
          db("lineas_investigacion").count("* as total"),
        ]);

      const estadisticas = {
        pnfs_activos: parseInt(pnfsCount[0].total),
        trayectos_activos: parseInt(trayectosCount[0].total),
        unidades_curriculares: parseInt(unidadesCount[0].total),
        lineas_investigacion: parseInt(lineasCount[0].total),
      };

      return FormatterResponseModel.respuestaPostgres(
        estadisticas,
        "Estadísticas obtenidas correctamente."
      );
    } catch (error) {
      error.details = { path: "CurricularModel.contarEstadisticas" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener estadísticas"
      );
    }
  }
}