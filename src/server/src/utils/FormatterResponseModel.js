/**
 * @class FormatterResponseModel
 * @description Clase utilitaria para estandarizar las respuestas de la API y el manejo de datos desde PostgreSQL.
 * Proporciona métodos para formatear respuestas exitosas, errores y conjuntos de datos de manera consistente.
 */
export default class FormatterResponseModel {
  /**
   * @static
   * @method validacionesComunes
   * @description Realiza validaciones básicas a la respuesta de la base de datos
   * @param {Object|Array} rows - Respuesta cruda de PostgreSQL
   * @returns {Object} Datos validados y normalizados
   * @throws {Error} Si no hay datos o la respuesta es inválida
   */
  static validacionesComunes(rows) {
    try {
      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        return rows;
      }

      // Maneja tanto arrays como objetos individuales
      const firstRow = Array.isArray(rows) ? rows[0] : rows;

      // Determina si es respuesta de procedimiento/función o consulta directa
      return firstRow?.p_resultado !== undefined ? firstRow.p_resultado : rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @static
   * @method respuestaError
   * @description Formatea y LANZA una respuesta de error estándar
   * @param {Object|Array|null} [rows=null] - Datos de error de la BD
   * @param {string} [title='Error'] - Título descriptivo del error
   * @throws {Object} Error formateado para propagación automática
   */
  static respuestaError(rows = null, title = "Error") {
    try {
      const resultado = rows ? this.validacionesComunes(rows) : {};
      // Si el resultado ya tiene estructura de error, lanzarlo directamente
      if (resultado.status === "error" || resultado.state === "error") {
        return {
          status: resultado.status_code || resultado.status || 400,
          state: "error",
          title: resultado.title || title,
          message: resultado.message || "Error en la operación",
          error: {
            code:
              resultado.error?.code ||
              resultado.codigo_error ||
              "UNKNOWN_ERROR",
            details: resultado.error?.details || resultado.details || {},
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Si no tiene estructura esperada, podría ser un error de PostgreSQL
      if (
        resultado.status === undefined &&
        resultado.status_code === undefined
      ) {
        // Es probablemente un error crudo de PostgreSQL
        return {
          status: 500,
          state: "error",
          title: "Error de Base de Datos",
          message: "Error en la operación de base de datos",
          error: {
            code: "DATABASE_ERROR",
            details: {
              originalError: resultado,
              postgresCode: resultado.code,
              postgresMessage: resultado.message,
            },
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Caso por defecto - lanzar error formateado
      return {
        status: resultado.status_code || 400,
        state: "error",
        title: title,
        message: resultado.message || "Error en la operación",
        error: {
          code: resultado.codigo_error || "OPERATION_ERROR",
          details: resultado.details || {},
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("💥 Error crítico en respuestaError:", error);

      // Lanzar error interno formateado
      throw {
        status: 500,
        state: "error",
        title: "Error interno en el servidor",
        message:
          "Lo sentimos, ha ocurrido un error interno. Por favor, intente más tarde.",
        error: {
          code: "INTERNAL_FORMATTER_ERROR",
          details: {
            originalError:
              process.env.MODE === "DEVELOPMENT" ? error.message : undefined,
          },
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * @static
   * @method respuestaSuccess
   * @description Formatea una respuesta con datos para el controlador
   * @param {Object|Array} [rows={}] - Conjunto de datos de la BD
   * @param {string} [title='Datos obtenidos'] - Título descriptivo
   * @returns {Object} Respuesta con datos formateados
   * @throws {Error} Si ocurre un error en el procesamiento
   */
  static respuestaSuccess(rows = {}, title = "Datos obtenidos") {
    try {
      return {
        status: rows.metadata?.status_code || 200,
        state: rows.metadata?.status_code >= 400 ? "error" : "success",
        title: title,
        message: rows.message,
        ...(rows?.data && { data: rows.data }),
        ...(rows?.metadata && { metadata: rows.metadata }),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @static
   * @method respuestaPostgres
   * @description Método inteligente que determina automáticamente el tipo de respuesta a formatear
   * @param {Object|Array} rows - Respuesta cruda de PostgreSQL
   * @param {string} [titleSuccess='Completado'] - Título para respuestas exitosas
   * @param {string} [titleError='Error'] - Título para respuestas de error
   * @returns {Object} Respuesta formateada según el tipo de resultado
   * @throws {Error} Si la respuesta indica un error explícito
   */
  static respuestaPostgres(rows, titleSuccess = "Completado") {
    try {
      const resultado = this.validacionesComunes(rows);

      if (resultado.status === "success") {
        return this.respuestaSuccess(resultado, titleSuccess);
      } else if (resultado.status === "error") {
        throw resultado;
      }

      return {
        status: resultado.status_code || 200,
        state: "success",
        title: titleSuccess,
        message: resultado.message || "Se obtuvieron los datos",
        data: resultado,
      };
    } catch (error) {
      throw error;
    }
  }
}
