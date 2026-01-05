import pg from "../database/pg.js";
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class SedeModel
 * @description Modelo para operaciones de base de datos relacionadas con sedes
 */
export default class SedeModel {
  /**
   * @name crearSede
   * @description Crear una nueva sede en la base de datos
   * @param {Object} datos - Datos de la sede
   * @param {string} datos.nombre - Nombre de la sede
   * @param {string} datos.direccion - Dirección de la sede
   * @param {string} datos.telefono - Teléfono de la sede
   * @param {string} datos.estado - Estado de la sede
   * @param {string} datos.google_maps - Enlace de Google Maps
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Object} Resultado de la inserción
   */
  static async crearSede(datos, usuarioId) {
    try {
      console.log("💾 [crearSede] Insertando sede en BD...");

      const { nombre_sede, ubicacion_sede, google_sede, ciudad_sede } = datos;

      // Insertar sede usando el procedimiento almacenado
      const { rows } = await pg.query(
        "CALL public.registrar_sede_completo($1, $2, $3, $4, $5, NULL)",
        [usuarioId, nombre_sede, ubicacion_sede, google_sede || null, ciudad_sede]
      );

      console.log("✅ Sede insertada en BD:", rows);

      // Si respuestaPostgres NO es async, no usar await
      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Sede creada en base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo crear sede:", { ...error });

      // Si respuestaError NO es async, no usar await
      throw FormatterResponseModel.respuestaError(
        error,
        "No se pudo crear la sede"
      );
    }
  }

  /**
   * @name mostrarSedes
   * @description Obtener todas las sedes de la base de datos
   * @returns {Object} Lista de sedes formateada
   */
  static async mostrarSedes() {
    try {
      const { rows } = await pg.query(
        `SELECT * FROM public.vista_sedes_completa`
      );

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Sedes obtenidas de base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo mostrar sedes:", error);
      return FormatterResponseModel.respuestaError(
        error,
        "No se pudieron obtener las sedes de la base de datos"
      );
    }
  }

  /**
   * @name obtenerSedePorId
   * @description Obtener una sede específica por ID
   * @param {number} idSede - ID de la sede
   * @returns {Object} Datos de la sede formateados
   */
  static async obtenerSedePorId(idSede) {
    try {
      console.log("💾 [obtenerSedePorId] Buscando sede en BD ID:", idSede);

      const { rows } = await pg.query(
        `SELECT *
         FROM vista_sedes_completa 
         WHERE id_sede = $1`,
        [idSede]
      );

      if (rows.length === 0) {
        console.log("ℹ️ Sede no encontrada en BD:", idSede);
        return FormatterResponseModel.respuestaPostgres(
          [],
          "Sede no encontrada en base de datos"
        );
      }

      console.log("✅ Sede encontrada en BD:", rows[0].id_sede);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Sede obtenida de base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo obtener sede por ID:", error);
      return FormatterResponseModel.respuestaError(
        error,
        "No se pudo obtener la sede de la base de datos"
      );
    }
  }

  /**
   * @name actualizarSede
   * @description Actualizar una sede existente
   * @param {number} idSede - ID de la sede a actualizar
   * @param {Object} datos - Datos actualizados
   * @param {string} datos.nombre - Nuevo nombre de la sede
   * @param {string} datos.direccion - Nueva dirección
   * @param {string} datos.telefono - Nuevo teléfono
   * @param {string} datos.estado - Nuevo estado
   * @param {string} datos.google_maps - Nuevo enlace de Google Maps
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Object} Resultado de la actualización
   */
  static async actualizarSede(idSede, datos, usuarioId) {
    try {
      console.log("💾 [actualizarSede] Actualizando sede en BD ID:", idSede);

      const { nombre, direccion, telefono, estado, google_maps } = datos;

      // Usar el procedimiento almacenado para actualizar
      const { rows } = await pg.query(
        "CALL public.actualizar_sede($1, $2, $3, $4, $5)",
        [usuarioId, idSede, nombre, direccion, google_maps || null]
      );

      console.log("✅ Sede actualizada en BD ID:", idSede);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Sede actualizada en base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo actualizar sede:", error);
      return FormatterResponseModel.respuestaError(
        error,
        "No se pudo actualizar la sede en la base de datos"
      );
    }
  }

  /**
   * @name eliminarSede
   * @description Eliminar una sede
   * @param {number} idSede - ID de la sede a eliminar
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Object} Resultado de la eliminación
   */
  static async eliminarSede(idSede, usuarioId) {
    try {
      console.log("💾 [eliminarSede] Eliminando sede de BD ID:", idSede);

      // Eliminar sede usando el procedimiento almacenado
      const { rows } = await pg.query("CALL public.eliminar_sede($1, $2)", [
        usuarioId,
        idSede,
      ]);

      console.log("✅ Sede eliminada de BD ID:", idSede);

      return FormatterResponseModel.respuestaPostgres(
        rows,
        "Sede eliminada de base de datos"
      );
    } catch (error) {
      console.error("💥 Error en modelo eliminar sede:", error);
      return FormatterResponseModel.respuestaError(
        error,
        "No se pudo eliminar la sede de la base de datos"
      );
    }
  }

  /**
   * @name verificarDependencias
   * @description Verificar si una sede tiene dependencias (aulas, etc.)
   * @param {number} idSede - ID de la sede
   * @returns {Object} Resultado de la verificación
   */
  static async verificarDependencias(idSede) {
    try {
      console.log(
        "💾 [verificarDependencias] Verificando dependencias para sede:",
        idSede
      );

      // Verificar si hay aulas asociadas a esta sede
      const aulasResult = await pg.query(
        "SELECT COUNT(*) as total FROM aulas WHERE id_sede = $1",
        [idSede]
      );

      const totalAulas = parseInt(aulasResult.rows[0].total);

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
      return FormatterResponseModel.respuestaError(
        error,
        "No se pudieron verificar las dependencias de la sede"
      );
    }
  }
}
