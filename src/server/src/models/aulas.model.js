// Importación de Knex
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
   */
  static async crear(datos, id_usuario) {
    try {
      const { id_sede, codigo, tipo, capacidad, id_pnf } = datos;

      const result = await db.raw(
        `CALL registrar_aula_completo(?, ?, ?, ?, ?, ?, NULL)`,
        [id_usuario, id_sede, codigo, tipo, capacidad, id_pnf || null]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
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
   * @description Obtener todas las aulas con soporte para parámetros de consulta
   */
  static async obtenerTodas(queryParams = {}) {
    try {
      // Construir query con Knex
      let query = db("vistas_aulas").select(
        "id_sede",
        "nombre_sede",
        "ubicacion_sede",
        "google_sede",
        "id_aula",
        "codigo_aula",
        "tipo_aula",
        "capacidad_aula"
      );

      // Aplicar filtros
      if (queryParams.idSede) {
        query = query.where("id_sede", queryParams.idSede);
      }

      if (queryParams.tipo) {
        query = query.where("tipo_aula", queryParams.tipo);
      }

      if (queryParams.codigo) {
        query = query.where("codigo_aula", "ilike", `%${queryParams.codigo}%`);
      }

      if (queryParams.minCapacidad) {
        query = query.where(
          "capacidad_aula",
          ">=",
          parseInt(queryParams.minCapacidad)
        );
      }

      // Aplicar ordenamiento
      if (queryParams.sort) {
        const allowedSortFields = [
          "nombre_sede",
          "codigo_aula",
          "tipo_aula",
          "capacidad_aula",
        ];

        const sortField = allowedSortFields.includes(queryParams.sort)
          ? queryParams.sort
          : "nombre_sede";

        const sortOrder =
          queryParams.order?.toUpperCase() === "DESC" ? "desc" : "asc";

        query = query.orderBy(sortField, sortOrder);
      } else {
        query = query
          .orderBy("nombre_sede", "asc")
          .orderBy("codigo_aula", "asc");
      }

      // Aplicar paginación
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        const offset = queryParams.page
          ? (parseInt(queryParams.page) - 1) * limit
          : 0;

        query = query.limit(limit).offset(offset);
      }

      const rows = await query;

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
   */
  static async buscarPorId(id_aula) {
    try {
      const aula = await db("aulas as a")
        .select(
          "a.id_aula",
          "a.codigo_aula",
          "a.tipo_aula",
          "a.capacidad_aula",
          "a.equipamiento",
          "a.estado",
          "s.id_sede",
          "s.nombre_sede as nombre_sede",
          "a.created_at",
          "a.updated_at"
        )
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .where("a.id_aula", id_aula)
        .first();

      return FormatterResponseModel.respuestaPostgres(
        aula ? [aula] : [],
        aula ? "Aula obtenida exitosamente" : "Aula no encontrada"
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
   */
  static async actualizar(id_aula, datos, id_usuario) {
    try {
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
      const result = await db("aulas")
        .where("id_aula", id_aula)
        .update(datosActualizacion);

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
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
   */
  static async eliminar(id_aula, id_usuario) {
    try {
      const result = await db("aulas").where("id_aula", id_aula).update({
        estado: "INACTIVO",
        fecha_actualizacion: db.fn.now(),
        id_usuario_actualizacion: id_usuario,
      });

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
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
   */
  static async filtrarPorTipo(tipo) {
    try {
      const aulas = await db("aulas as a")
        .select(
          "a.id_aula",
          "a.codigo_aula",
          "a.tipo_aula",
          "a.capacidad_aula",
          "a.equipamiento",
          "a.estado",
          "s.id_sede",
          "s.nombre_sede as nombre_sede"
        )
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .where("a.tipo_aula", tipo)
        .where("a.estado", "ACTIVO");

      return FormatterResponseModel.respuestaPostgres(
        aulas,
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
   */
  static async filtrarPorSede(sede, queryParams = {}) {
    try {
      const page = parseInt(queryParams.page) || 1;
      const limit = parseInt(queryParams.limit) || 10;
      const offset = (page - 1) * limit;
      const search = queryParams.search || "";
      const sortOrder = queryParams.sort_order || "codigo";

      // Mapeo de campos de ordenamiento - CORREGIDO
      const sortMapping = {
        codigo: "a.codigo_aula",
        tipo: "a.tipo_aula",
        capacidad: "a.capacidad_aula",
        fecha_creacion: "a.created_at",
        sede: "s.nombre_sede",
      };

      const orderBy = sortMapping[sortOrder] || "a.codigo_aula";

      // Construir query base
      let query = db("aulas as a")
        .select(
          "a.id_aula",
          "a.codigo_aula",
          "a.tipo_aula",
          "a.capacidad_aula",
          "a.created_at",
          "s.id_sede",
          "s.nombre_sede as nombre_sede"
        )
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .where("a.id_sede", sede);

      // Aplicar búsqueda
      if (search) {
        query = query.where(function () {
          this.where("a.codigo_aula", "ilike", `%${search}%`)
            .orWhere("a.tipo_aula", "ilike", `%${search}%`)
            .orWhere("s.nombre_sede", "ilike", `%${search}%`);
        });
      }

      // ¡PROBLEMA AQUÍ! - Obtener total CORREGIDO
      // Necesitamos clonar la query SIN las columnas individuales
      const countQuery = db("aulas as a")
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .where("a.id_sede", sede);

      if (search) {
        countQuery.where(function () {
          this.where("a.codigo_aula", "ilike", `%${search}%`)
            .orWhere("a.tipo_aula", "ilike", `%${search}%`)
            .orWhere("s.nombre_sede", "ilike", `%${search}%`);
        });
      }

      const totalResult = await countQuery.count("* as total").first();
      const total = parseInt(totalResult.total);

      // Aplicar ordenamiento y paginación
      const aulas = await query
        .orderBy(orderBy, "asc")
        .limit(limit)
        .offset(offset);

      // Calcular información de paginación
      const totalPages = Math.ceil(total / limit);

      const data = {
        aulas,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      return FormatterResponseModel.respuestaPostgres(
        data,
        `Aulas de la sede obtenidas exitosamente`
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
   * @description Obtener aulas disponibles para un PNF específico
   */
  static async obtenerAulasPorPnf(codigoPNF) {
    try {
      const aulas = await db("aulas as a")
        .select(
          "a.id_aula",
          "a.codigo_aula",
          "a.tipo_aula",
          "a.capacidad_aula",
          "s.nombre_sede as nombre_sede",
          "p.nombre_pnf"
        )
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .leftJoin("aulas_pnfs as ap", "a.id_aula", "ap.id_aula")
        .leftJoin("pnfs as p", "ap.id_pnf", "p.id_pnf")
        .where("p.codigo_pnf", codigoPNF)
        .where("a.estado", "ACTIVO")
        .orderBy("a.codigo_aula", "asc");

      return FormatterResponseModel.respuestaPostgres(
        aulas,
        `Aulas para PNF ${codigoPNF} obtenidas exitosamente`
      );
    } catch (error) {
      error.details = { path: "AulaModel.obtenerAulasPorPnf" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener aulas por PNF"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerDisponibles
   * @description Obtener aulas disponibles para un horario específico
   */
  static async obtenerDisponibles(filtros = {}) {
    try {
      const {
        fecha,
        hora_inicio,
        hora_fin,
        id_sede = null,
        capacidad_min = null,
      } = filtros;

      let query = db("aulas as a")
        .select(
          "a.id_aula",
          "a.codigo_aula",
          "a.tipo_aula",
          "a.capacidad_aula",
          "s.nombre_sede as nombre_sede"
        )
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .where("a.estado", "ACTIVO")
        .whereNotExists(function () {
          this.select(db.raw("1"))
            .from("horarios as h")
            .whereRaw("h.id_aula = a.id_aula")
            .whereRaw("h.fecha = ?", [fecha])
            .where(function () {
              this.whereRaw("h.hora_inicio < ?", [hora_fin]).whereRaw(
                "h.hora_fin > ?",
                [hora_inicio]
              );
            });
        });

      // Filtros adicionales
      if (id_sede) {
        query = query.where("a.id_sede", id_sede);
      }

      if (capacidad_min) {
        query = query.where("a.capacidad_aula", ">=", capacidad_min);
      }

      const aulas = await query.orderBy("a.codigo_aula", "asc");

      return FormatterResponseModel.respuestaPostgres(
        aulas,
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

  /**
   * @static
   * @async
   * @method obtenerAulasConCapacidad
   * @description Obtener aulas con capacidad suficiente para un número de estudiantes
   */
  static async obtenerAulasConCapacidad(capacidadMinima) {
    try {
      const aulas = await db("aulas as a")
        .select(
          "a.id_aula",
          "a.codigo_aula",
          "a.tipo_aula",
          "a.capacidad_aula",
          "s.nombre_sede as nombre_sede"
        )
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .where("a.estado", "ACTIVO")
        .where("a.capacidad_aula", ">=", capacidadMinima)
        .orderBy("a.capacidad_aula", "asc")
        .orderBy("a.codigo_aula", "asc");

      return FormatterResponseModel.respuestaPostgres(
        aulas,
        `Aulas con capacidad mínima de ${capacidadMinima} obtenidas exitosamente`
      );
    } catch (error) {
      error.details = { path: "AulaModel.obtenerAulasConCapacidad" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener aulas con capacidad"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerEstadisticas
   * @description Obtener estadísticas de aulas
   */
  static async obtenerEstadisticas() {
    try {
      const [totalAulas, aulasActivas, porTipo, porSede] = await Promise.all([
        db("aulas").count("* as total").first(),
        db("aulas").count("* as total").where("estado", "ACTIVO").first(),
        db("aulas")
          .select("tipo")
          .count("* as total")
          .where("estado", "ACTIVO")
          .groupBy("tipo"),
        db("aulas as a")
          .select("s.nombre_sede as sede", db.raw("COUNT(*) as total"))
          .join("sedes as s", "a.id_sede", "s.id_sede")
          .where("a.estado", "ACTIVO")
          .groupBy("s.nombre_sede"),
      ]);

      const estadisticas = {
        total: parseInt(totalAulas.total),
        activas: parseInt(aulasActivas.total),
        porTipo,
        porSede,
      };

      return FormatterResponseModel.respuestaPostgres(
        [estadisticas],
        "Estadísticas de aulas obtenidas exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.obtenerEstadisticas" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener estadísticas de aulas"
      );
    }
  }

  /**
   * @static
   * @async
   * @method asignarAulaAPnf
   * @description Asignar un aula a un PNF específico
   */
  static async asignarAulaAPnf(id_aula, id_pnf, id_usuario) {
    try {
      const result = await db.raw(`CALL asignar_aula_pnf(?, ?, ?, NULL)`, [
        id_usuario,
        id_aula,
        id_pnf,
      ]);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Aula asignada al PNF exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.asignarAulaAPnf" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al asignar aula al PNF"
      );
    }
  }

  /**
   * @static
   * @async
   * @method removerAulaDePnf
   * @description Remover un aula de un PNF
   */
  static async removerAulaDePnf(id_aula, id_pnf, id_usuario) {
    try {
      const result = await db("aulas_pnfs")
        .where("id_aula", id_aula)
        .where("id_pnf", id_pnf)
        .delete();

      return FormatterResponseModel.respuestaPostgres(
        { affectedRows: result },
        "Aula removida del PNF exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.removerAulaDePnf" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al remover aula del PNF"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscarAulasPorCodigo
   * @description Buscar aulas por código (búsqueda parcial)
   */
  static async buscarAulasPorCodigo(codigo) {
    try {
      const aulas = await db("aulas as a")
        .select(
          "a.id_aula",
          "a.codigo_aula",
          "a.tipo_aula",
          "a.capacidad_aula",
          "s.nombre_sede as nombre_sede"
        )
        .join("sedes as s", "a.id_sede", "s.id_sede")
        .where("a.codigo_aula", "ilike", `%${codigo}%`)
        .where("a.estado", "ACTIVO")
        .orderBy("a.codigo_aula", "asc")
        .limit(20);

      return FormatterResponseModel.respuestaPostgres(
        aulas,
        "Búsqueda de aulas por código completada"
      );
    } catch (error) {
      error.details = { path: "AulaModel.buscarAulasPorCodigo" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al buscar aulas por código"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerTiposAula
   * @description Obtener todos los tipos de aula distintos disponibles
   */
  static async obtenerTiposAula() {
    try {
      const tipos = await db("aulas")
        .distinct("tipo")
        .where("estado", "ACTIVO")
        .orderBy("tipo", "asc");

      return FormatterResponseModel.respuestaPostgres(
        tipos,
        "Tipos de aula obtenidos exitosamente"
      );
    } catch (error) {
      error.details = { path: "AulaModel.obtenerTiposAula" };
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener tipos de aula"
      );
    }
  }
}
