import config from "../config/index.js";

/**
 * @class FormatterResponseController
 * @description Maneja las posibles respuestas que dará el controlador hacia el frontend
 * @author Gabriel Leonett
 */
export default class FormatterResponseController {
  /**
   * @static
   * @method respuestaExito
   * @description Devuelve una respuesta exitosa estructurada
   * @param {Object} res Objeto response de Express
   * @param {Object} serviceResponse Respuesta del servicio
   * @returns {Object} Respuesta estructurada para el frontend
   */
  static respuestaExito(res, serviceResponse) {
    try {
      const { data = null, message = null, metadata = {} } = serviceResponse;

      // Eliminar redundancias de metadata
      const {
        status: metadataStatus,
        title: metadataTitle,
        timestamp,
        ...cleanMetadata
      } = metadata;

      const response = {
        success: true,
        status: serviceResponse.status || 200,
        title: metadataTitle || serviceResponse.title || "Operación Exitosa",
        message: message || "La operación se completó correctamente",
        data: data,
        ...(Object.keys(cleanMetadata).length > 0 && {
          metadata: cleanMetadata,
        }),
      };

      // Incluir paginación si existe
      if (metadata.pagination) {
        response.pagination = metadata.pagination;
      }

      // Log del éxito
      config.logger.info({
        status: response.status,
        title: response.title,
        message: response.message,
        hasData: !!data,
        timestamp: new Date().toISOString(),
      });

      return res.status(response.status).json(response);
    } catch (error) {
      config.logger.error("Error crítico en respuestaExito:", {
        error: error.message,
        stack: error.stack,
        serviceResponse: serviceResponse,
      });

      return this.respuestaError(res, {
        status: 500,
        title: "Error en el Controlador",
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  /**
   * @static
   * @method respuestaError
   * @description Devuelve una respuesta de error estructurada
   * @param {Object} res Objeto response de Express
   * @param {Object} serviceResponse Respuesta de error del servicio
   * @returns {Object} Respuesta de error estructurada para el frontend
   */
  static async respuestaError(res, serviceResponse) {
    try {
      // DETECCIÓN MEJORADA DE ERRORES 4xx
      const isClientError =
        (serviceResponse.status >= 400 && serviceResponse.status < 500) ||
        serviceResponse.error?.code === "UNAUTHORIZED" ||
        serviceResponse.error?.code === "VALIDATION_ERROR" ||
        serviceResponse.error?.code?.includes("NOT_FOUND") ||
        serviceResponse.error?.code?.includes("NO_") ||
        serviceResponse.error?.code?.includes("INVALID_") ||
        serviceResponse.title?.includes("No Autorizado") ||
        serviceResponse.title?.includes("Validación") ||
        serviceResponse.title?.includes("No Encontrado") ||
        serviceResponse.message?.includes("inválid") ||
        serviceResponse.message?.includes("incorrect") ||
        serviceResponse.message?.includes("no encontrado");

      if (isClientError) {
        config.logger.warn("Error del cliente detectado:", {
          status: serviceResponse.status,
          title: serviceResponse.title,
          message: serviceResponse.message,
          errorCode: serviceResponse.error?.code,
          timestamp: new Date().toISOString(),
        });

        // Caso específico: Validación
        if (
          serviceResponse.error?.code === "VALIDATION_ERROR" ||
          serviceResponse.error?.details?.validationErrors
        ) {
          return this.respuestaValidacionError(res, serviceResponse);
        }

        // Para otros errores 4xx, mostrar el mensaje original
        const status = serviceResponse.status || 400;

        const response = {
          success: false,
          status: status,
          title: serviceResponse.title || this.getDefaultTitle(status),
          message: serviceResponse.message || "Error del cliente",
          error: serviceResponse.error?.details || {},
        };

        return res.status(status).json(response);
      }

      // Si es una instancia de Error nativa
      if (serviceResponse instanceof Error) {
        config.logger.error("Error nativo capturado:", {
          message: serviceResponse.message,
          stack: serviceResponse.stack,
          name: serviceResponse.name,
        });

        return this.respuestaError(res, {
          status: 500,
          title: "Error en el Controlador",
          message: serviceResponse.message,
          error: {
            code: "INTERNAL_ERROR",
            details: {
              stack:
                process.env.MODE === "DEVELOPMENT"
                  ? serviceResponse.stack
                  : undefined,
            },
          },
        });
      }

      // Para errores 500 (sin detalles al usuario)
      if (serviceResponse.status === 500 || !serviceResponse.status) {
        config.logger.error("Error interno del servidor:", {
          status: 500,
          title: serviceResponse.title,
          message: serviceResponse.message,
          errorCode: serviceResponse.error?.code,
          stack: serviceResponse.error?.details?.stack,
          timestamp: new Date().toISOString(),
        });

        const response = {
          success: false,
          status: 500,
          title: "Error en el Controlador",
          message: "Error interno del servidor",
          error: {
            code: serviceResponse.error?.code || "INTERNAL_SERVER_ERROR",
          },
        };

        return res.status(500).json(response);
      }

      // Caso por defecto (otros errores)
      const defaultStatus = 500;
      const status =
        (typeof serviceResponse.status === "number" &&
          serviceResponse.status) ||
        defaultStatus;

      config.logger.error("Error genérico:", {
        status: status,
        title: serviceResponse.title,
        message: serviceResponse.message,
        errorDetails: serviceResponse.error?.details,
        timestamp: new Date().toISOString(),
      });

      const response = {
        success: false,
        status: status,
        title: serviceResponse.title || this.getDefaultTitle(status),
        message: serviceResponse.message || "Error interno del servidor",
        error: serviceResponse.error?.details,
      };

      return res.status(status).json(response);
    } catch (internalError) {
      config.logger.error("Error crítico en respuestaError:", {
        error: internalError.message,
        stack: internalError.stack,
        serviceResponse: serviceResponse,
        timestamp: new Date().toISOString(),
      });

      return res.status(500).json({
        success: false,
        status: 500,
        title: "Error Crítico",
        message: "Error interno del servidor",
        error: {
          code: "CONTROLLER_ERROR",
        },
      });
    }
  }

  /**
   * @static
   * @method respuestaValidacionError
   * @description Maneja específicamente errores de validación
   * @param {Object} res Objeto response de Express
   * @param {Object} serviceResponse Respuesta de validación del servicio
   * @returns {Object} Respuesta de validación estructurada
   */
  static respuestaValidacionError(res, serviceResponse) {
    const errorInfo = serviceResponse.error || {};

    let validationErrors = [];

    if (errorInfo.details?.validationErrors) {
      validationErrors = errorInfo.details.validationErrors;
    } else if (serviceResponse.validationErrors) {
      validationErrors = serviceResponse.validationErrors;
    } else if (errorInfo.validationErrors) {
      validationErrors = errorInfo.validationErrors;
    } else if (serviceResponse.error?.validationErrors) {
      validationErrors = serviceResponse.error.validationErrors;
    }

    const response = {
      success: false,
      status: 400,
      title: serviceResponse.title || "Error de Validación",
      message: serviceResponse.message || "Datos inválidos proporcionados",
      data: null,
      error: {
        validationErrors: this.formatValidationErrors(validationErrors),
        totalErrors: validationErrors.length,
      },
    };

    config.logger.warn("Error de validación:", {
      status: 400,
      title: response.title,
      message: response.message,
      totalErrors: validationErrors.length,
      validationErrors: validationErrors,
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json(response);
  }

  /**
   * @static
   * @method formatValidationErrors
   * @description Formatea los errores de validación para una estructura consistente
   * @param {Array|Object} errors Errores de validación
   * @returns {Array} Errores formateados
   */
  static formatValidationErrors(errors) {
    if (!errors) return [];

    if (Array.isArray(errors)) {
      return errors.map((error) => ({
        field: error.field || error.path || "unknown",
        message: error.message || "Campo inválido",
        value: error.value !== undefined ? error.value : null,
        type: error.type || "validation",
      }));
    }

    if (typeof errors === "object") {
      return Object.keys(errors).map((key) => ({
        field: key,
        message: errors[key].message || errors[key] || "Campo inválido",
        value: errors[key].value !== undefined ? errors[key].value : null,
        type: errors[key].type || "validation",
      }));
    }

    return [];
  }

  /**
   * @static
   * @method respuestaServicio
   * @description Método principal que maneja cualquier respuesta del servicio
   * @param {Object} res Objeto response de Express
   * @param {Object} serviceResponse Respuesta del servicio
   * @returns {Object} Respuesta estructurada
   */
  static respuestaServicio(res, serviceResponse) {
    try {
      if (!serviceResponse) {
        config.logger.error("Respuesta del servicio nula o indefinida");
        return this.respuestaError(res, {
          status: 500,
          title: "Error del Servicio",
          message: "La respuesta del servicio es inválida",
        });
      }

      if (serviceResponse.success === true) {
        return this.respuestaExito(res, serviceResponse);
      } else {
        return this.respuestaError(res, serviceResponse);
      }
    } catch (error) {
      config.logger.error("Error procesando respuesta del servicio:", {
        error: error.message,
        stack: error.stack,
      });

      return this.respuestaError(res, {
        status: 500,
        title: "Error en el Controlador",
        message: "Error procesando la respuesta",
        error: error.message,
      });
    }
  }

  /**
   * @static
   * @method manejarServicio
   * @description Método optimizado para manejar servicios con propagación automática
   * @param {Object} res Objeto response de Express
   * @param {Promise} servicioPromise Promesa del servicio
   * @returns {Object} Respuesta estructurada
   */
  static async manejarServicio(res, servicioPromise) {
    try {
      const resultado = await servicioPromise;
      
      if (resultado === undefined || resultado === null) {
        config.logger.error("Resultado nulo del servicio");
        return this.respuestaError(res, {
          status: 500,
          title: "Error del Servicio",
          message: "El servicio no devolvió un resultado válido",
        });
      }

      if (resultado.success === false) {
        throw resultado;
      }
      return this.respuestaExito(res, resultado);
    } catch (error) {
      config.logger.error("Error procesando servicio:", {
        error: error.message,
        stack: error.stack,
      });
      return this.respuestaError(res, error);
    }
  }

  /**
   * @static
   * @method respuestaDatos
   * @description Versión simplificada para respuestas solo con datos
   * @param {Object} res Objeto response de Express
   * @param {Object} data Datos a enviar
   * @param {Object} metadata Metadatos adicionales
   * @returns {Object} Respuesta estructurada
   */
  static respuestaDatos(res, data, metadata = {}) {
    config.logger.info("Respuesta de datos generada", {
      dataType: typeof data,
      hasMetadata: Object.keys(metadata).length > 0,
      timestamp: new Date().toISOString(),
    });

    return this.respuestaExito(res, {
      status: 200,
      success: true,
      message: metadata.message || "Datos recuperados exitosamente",
      data: data,
      metadata: metadata,
    });
  }

  /**
   * @static
   * @method respuestaPaginada
   * @description Respuesta específica para datos paginados
   * @param {Object} res Objeto response de Express
   * @param {Array} data Datos de la página actual
   * @param {Object} pagination Información de paginación
   * @param {string} message Mensaje personalizado
   * @returns {Object} Respuesta paginada estructurada
   */
  static respuestaPaginada(res, data, pagination, message = null) {
    config.logger.info("Respuesta paginada generada", {
      dataCount: data?.length || 0,
      pagination: pagination,
      timestamp: new Date().toISOString(),
    });

    return this.respuestaExito(res, {
      status: 200,
      success: true,
      message: message || "Datos paginados recuperados exitosamente",
      data: data,
      metadata: {
        pagination: pagination,
        title: "Datos Paginados",
      },
    });
  }

  /**
   * @static
   * @method getDefaultTitle
   * @description Obtiene título por defecto basado en el código de estado
   * @param {number} status Código HTTP
   * @returns {string} Título descriptivo
   */
  static getDefaultTitle(status) {
    const titles = {
      200: "Operación Exitosa",
      201: "Recurso Creado",
      204: "Sin Contenido",
      400: "Solicitud Incorrecta",
      401: "No Autorizado",
      403: "Acceso Prohibido",
      404: "No Encontrado",
      409: "Conflicto",
      422: "Error de Validación",
      500: "Error Interno del Servidor",
      503: "Servicio No Disponible",
    };
    return titles[status] || "Error del Servidor";
  }

  /**
   * @static
   * @method getErrorCode
   * @description Obtiene código de error basado en el código de estado
   * @param {number} status Código HTTP
   * @returns {string} Código de error
   */
  static getErrorCode(status) {
    const codes = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "VALIDATION_ERROR",
      500: "INTERNAL_ERROR",
    };
    return codes[status] || "UNKNOWN_ERROR";
  }
}