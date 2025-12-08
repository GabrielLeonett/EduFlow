import db from "../database/db.js";
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class SedeModel
 * @description Modelo para operaciones de base de datos relacionadas con sedes
 */
export default class SedeModel {
  /**
   * @name crearSede
   * @description Crear una nueva sede en la base de datos
   */
  static async crearSede(datos, usuarioId) {
    try {
      console.log("💾 [crearSede] Insertando sede en BD...");

      const { nombre_sede, ubicacion_sede, google_sede, ciudad_sede } = datos;

      // Usar Knex.raw para procedimientos almacenados
      const result = await db.raw(
        "CALL public.registrar_sede_completo(?, ?, ?, ?, ?, NULL)",
        [
          usuarioId,
          nombre_sede,
          ubicacion_sede,
          google_sede || null,
          ciudad_sede,
        ]
      );

      console.log("✅ Sede insertada en BD");

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Sede creada en base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo crear sede:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudo crear la sede"
      );
    }
  }

  /**
   * @name mostrarSedes
   * @description Obtener todas las sedes de la base de datos
   */
  static async mostrarSedes() {
    try {
      const sedes = await db("vista_sedes_completa").select("*");

      return FormatterResponseModel.respuestaPostgres(
        sedes,
        "Sedes obtenidas de base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo mostrar sedes:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudieron obtener las sedes de la base de datos"
      );
    }
  }

  /**
   * @name obtenerSedePorId
   * @description Obtener una sede específica por ID
   */
  static async obtenerSedePorId(idSede) {
    try {
      console.log("💾 [obtenerSedePorId] Buscando sede en BD ID:", idSede);

      const sede = await db("vista_sedes_completa")
        .where("id_sede", idSede)
        .first();

      if (!sede) {
        console.log("ℹ️ Sede no encontrada en BD:", idSede);
        return FormatterResponseModel.respuestaPostgres(
          [],
          "Sede no encontrada en base de datos"
        );
      }

      console.log("✅ Sede encontrada en BD:", sede.id_sede);

      return FormatterResponseModel.respuestaPostgres(
        [sede],
        "Sede obtenida de base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo obtener sede por ID:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudo obtener la sede de la base de datos"
      );
    }
  }

  /**
   * @name actualizarSede
   * @description Actualizar una sede existente
   */
  static async actualizarSede(idSede, datos, usuarioId) {
    try {
      console.log("💾 [actualizarSede] Actualizando sede en BD ID:", idSede);

      const { nombre, direccion, google_maps } = datos;

      // Usar Knex.raw para procedimientos almacenados
      const result = await db.raw(
        "CALL public.actualizar_sede(?, ?, ?, ?, ?)",
        [usuarioId, idSede, nombre, direccion, google_maps || null]
      );

      console.log("✅ Sede actualizada en BD ID:", idSede);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Sede actualizada en base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo actualizar sede:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudo actualizar la sede en la base de datos"
      );
    }
  }

  /**
   * @name eliminarSede
   * @description Eliminar una sede
   */
  static async eliminarSede(idSede, usuarioId) {
    try {
      console.log("💾 [eliminarSede] Eliminando sede de BD ID:", idSede);

      // Usar Knex.raw para procedimientos almacenados
      const result = await db.raw("CALL public.eliminar_sede(?, ?)", [
        usuarioId,
        idSede,
      ]);

      console.log("✅ Sede eliminada de BD ID:", idSede);

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Sede eliminada de base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo eliminar sede:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudo eliminar la sede de la base de datos"
      );
    }
  }

  /**
   * @name verificarDependencias
   * @description Verificar si una sede tiene dependencias (aulas, etc.)
   */
  static async verificarDependencias(idSede) {
    try {
      console.log("💾 [verificarDependencias] Verificando dependencias para sede:", idSede);

      // Verificar si hay aulas asociadas a esta sede usando Knex
      const aulasCount = await db("aulas")
        .count("* as total")
        .where("id_sede", idSede)
        .first();

      const totalAulas = parseInt(aulasCount.total);

      console.log(`ℹ️ Sede ${idSede} tiene ${totalAulas} aulas asociadas`);

      return FormatterResponseModel.respuestaPostgres(
        {
          tiene_dependencias: totalAulas > 0,
          total_aulas: totalAulas,
          dependencias: totalAulas > 0 ? ["aulas"] : [],
        },
        "Dependencias verificadas"
      );
    } catch (error) {
      console.error("💥 Error en modelo verificar dependencias:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudieron verificar las dependencias de la sede"
      );
    }
  }

  /**
   * @name buscarSedes
   * @description Buscar sedes por término de búsqueda
   * @param {string} termino - Término de búsqueda
   * @returns {Object} Sedes encontradas
   */
  static async buscarSedes(termino) {
    try {
      console.log("🔍 [buscarSedes] Buscando sedes con término:", termino);

      const sedes = await db("vista_sedes_completa")
        .where(function() {
          this.where("nombre_sede", "ilike", `%${termino}%`)
            .orWhere("ubicacion_sede", "ilike", `%${termino}%`)
            .orWhere("ciudad_sede", "ilike", `%${termino}%`);
        })
        .orderBy("nombre_sede", "asc")
        .limit(50);

      return FormatterResponseModel.respuestaPostgres(
        sedes,
        "Búsqueda de sedes completada"
      );
    } catch (error) {
      console.error("💥 Error en modelo buscar sedes:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudo realizar la búsqueda de sedes"
      );
    }
  }

  /**
   * @name obtenerSedesConEstadisticas
   * @description Obtener sedes con estadísticas (número de aulas, PNFs, etc.)
   */
  static async obtenerSedesConEstadisticas() {
    try {
      console.log("📊 [obtenerSedesConEstadisticas] Obteniendo estadísticas de sedes");

      // Obtener sedes básicas
      const sedes = await db("vista_sedes_completa")
        .select("*")
        .orderBy("nombre_sede", "asc");

      // Para cada sede, obtener estadísticas
      const sedesConEstadisticas = await Promise.all(
        sedes.map(async (sede) => {
          const [aulasCount, pnfsCount, profesoresCount] = await Promise.all([
            db("aulas").count("* as total").where("id_sede", sede.id_sede).first(),
            db("pnfs").count("* as total").where("id_sede", sede.id_sede).first(),
            db("profesores as p")
              .join("users as u", "p.id_profesor", "u.cedula")
              .join("profesor_sede as ps", "p.id_profesor", "ps.id_profesor")
              .count("* as total")
              .where("ps.id_sede", sede.id_sede)
              .first(),
          ]);

          return {
            ...sede,
            estadisticas: {
              total_aulas: parseInt(aulasCount.total),
              total_pnfs: parseInt(pnfsCount.total),
              total_profesores: parseInt(profesoresCount.total),
            }
          };
        })
      );

      return FormatterResponseModel.respuestaPostgres(
        sedesConEstadisticas,
        "Sedes con estadísticas obtenidas correctamente"
      );
    } catch (error) {
      console.error("💥 Error en modelo obtener sedes con estadísticas:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudieron obtener las estadísticas de las sedes"
      );
    }
  }

  /**
   * @name obtenerSedesActivas
   * @description Obtener solo las sedes activas
   */
  static async obtenerSedesActivas() {
    try {
      const sedesActivas = await db("vista_sedes_completa")
        .where("activo", true)
        .orderBy("nombre_sede", "asc");

      return FormatterResponseModel.respuestaPostgres(
        sedesActivas,
        "Sedes activas obtenidas correctamente"
      );
    } catch (error) {
      console.error("💥 Error en modelo obtener sedes activas:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudieron obtener las sedes activas"
      );
    }
  }

  /**
   * @name obtenerEstadisticasGenerales
   * @description Obtener estadísticas generales de todas las sedes
   */
  static async obtenerEstadisticasGenerales() {
    try {
      console.log("📊 [obtenerEstadisticasGenerales] Obteniendo estadísticas generales");

      const [
        totalSedes,
        sedesActivas,
        totalAulas,
        totalPNFs,
        sedesPorCiudad
      ] = await Promise.all([
        db("sedes").count("* as total").first(),
        db("sedes").count("* as total").where("activo", true).first(),
        db("aulas").count("* as total").first(),
        db("pnfs").count("* as total").first(),
        db("sedes")
          .select("ciudad_sede")
          .count("* as total")
          .groupBy("ciudad_sede")
          .orderBy("total", "desc"),
      ]);

      const estadisticas = {
        total_sedes: parseInt(totalSedes.total),
        sedes_activas: parseInt(sedesActivas.total),
        total_aulas: parseInt(totalAulas.total),
        total_pnfs: parseInt(totalPNFs.total),
        sedes_por_ciudad: sedesPorCiudad.map(item => ({
          ciudad: item.ciudad_sede,
          total: parseInt(item.total)
        })),
        promedio_aulas_por_sede: (parseInt(totalAulas.total) / parseInt(totalSedes.total)).toFixed(2)
      };

      return FormatterResponseModel.respuestaPostgres(
        [estadisticas],
        "Estadísticas generales obtenidas correctamente"
      );
    } catch (error) {
      console.error("💥 Error en modelo obtener estadísticas generales:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudieron obtener las estadísticas generales"
      );
    }
  }

  /**
   * @name obtenerSedesConPaginacion
   * @description Obtener sedes con paginación y filtros
   * @param {Object} filtros - Filtros de búsqueda
   * @param {number} filtros.page - Página actual
   * @param {number} filtros.limit - Elementos por página
   * @param {string} filtros.search - Término de búsqueda
   * @param {string} filtros.ciudad - Filtrar por ciudad
   * @param {boolean} filtros.activo - Filtrar por estado activo
   */
  static async obtenerSedesConPaginacion(filtros = {}) {
    try {
      const page = parseInt(filtros.page) || 1;
      const limit = parseInt(filtros.limit) || 20;
      const offset = (page - 1) * limit;

      // Construir query base
      let query = db("vista_sedes_completa");

      // Aplicar filtros
      if (filtros.search) {
        const searchTerm = `%${filtros.search}%`;
        query = query.where(function() {
          this.where("nombre_sede", "ilike", searchTerm)
            .orWhere("ubicacion_sede", "ilike", searchTerm)
            .orWhere("ciudad_sede", "ilike", searchTerm);
        });
      }

      if (filtros.ciudad) {
        query = query.where("ciudad_sede", filtros.ciudad);
      }

      if (filtros.activo !== undefined) {
        query = query.where("activo", filtros.activo);
      }

      // Obtener total para paginación
      const totalResult = await query.clone().count("* as total").first();
      const total = parseInt(totalResult.total);

      // Aplicar paginación
      const sedes = await query
        .select("*")
        .orderBy("nombre_sede", "asc")
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      const resultado = {
        sedes,
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
        resultado,
        "Sedes obtenidas con paginación correctamente"
      );
    } catch (error) {
      console.error("💥 Error en modelo obtener sedes con paginación:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudieron obtener las sedes con paginación"
      );
    }
  }

  /**
   * @name obtenerCiudadesDisponibles
   * @description Obtener lista de ciudades disponibles para sedes
   */
  static async obtenerCiudadesDisponibles() {
    try {
      const ciudades = await db("sedes")
        .distinct("ciudad_sede")
        .where("ciudad_sede", "!=", "")
        .whereNotNull("ciudad_sede")
        .orderBy("ciudad_sede", "asc");

      return FormatterResponseModel.respuestaPostgres(
        ciudades,
        "Ciudades disponibles obtenidas correctamente"
      );
    } catch (error) {
      console.error("💥 Error en modelo obtener ciudades disponibles:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudieron obtener las ciudades disponibles"
      );
    }
  }

  /**
   * @name reactivarSede
   * @description Reactivar una sede previamente eliminada
   * @param {number} idSede - ID de la sede a reactivar
   * @param {number} usuarioId - ID del usuario que realiza la acción
   */
  static async reactivarSede(idSede, usuarioId) {
    try {
      console.log("🔄 [reactivarSede] Reactivando sede ID:", idSede);

      const result = await db.raw(
        "CALL public.reactivar_sede(?, ?)",
        [usuarioId, idSede]
      );

      return FormatterResponseModel.respuestaPostgres(
        result.rows || result,
        "Sede reactivada correctamente"
      );
    } catch (error) {
      console.error("💥 Error en modelo reactivar sede:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudo reactivar la sede"
      );
    }
  }
}