// Funcion para generar reportes en caso de errores internos
import logger from "../config/winston.config.js";

/**
 * @class FormatterResponseController
 * @description Maneja las posibles respuestas que dará el controlador hacia el frontend
 * @author Gabriel Leonett
 */
export default class FormatterResponseController {
  /**
   * @static
   * @method getTranslation
   * @description Obtiene traducción usando i18next
   */
  static getTranslation(req, key, params = {}) {
    try {
      if (req && req.t) {
        return req.t(key, params);
      }

      // Fallback mínimo para casos extremos
      return this.getMinimalFallback(key, params);
    } catch (error) {
      logger.warn(`Error en getTranslation: ${error.message}`);
      return key;
    }
  }

  /**
   * @static
   * @method getMinimalFallback
   * @description Fallback mínimo embebido (solo para emergencias)
   */
  static getMinimalFallback(key, params = {}) {
    const minimal = {
      "formatter:success:default_message": "Operación exitosa",
      "formatter:success:default_title": "Éxito",
      "formatter:error:internal_server": "Error interno del servidor",
      "formatter:error:validation": "Error de validación",
    };

    let translation = minimal[key] || key;

    // Interpolación básica
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });

    return translation;
  }

  /**
   * @static
   * @method respuestaExito
   * @description Devuelve una respuesta exitosa estructurada
   * @param {Object} res Objeto response de Express
   * @param {Object} serviceResponse Respuesta del servicio
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Object} Respuesta estructurada para el frontend
   */
  static respuestaExito(res, serviceResponse, req = null) {
    try {
      const { data = null, message = null, metadata = {} } = serviceResponse;

      // Eliminar redundancias de metadata
      const {
        status: metadataStatus,
        title: metadataTitle,
        timestamp,
        ...cleanMetadata
      } = metadata;

      // Obtener mensajes traducidos
      const translatedMessage =
        message || this.getTranslation(req, "success:default_message");

      const translatedTitle =
        metadataTitle ||
        serviceResponse.title ||
        this.getTranslation(req, "success:default_title");

      const response = {
        success: true,
        status: serviceResponse.status || 200,
        title: translatedTitle,
        message: translatedMessage,
        data: data,
        ...(Object.keys(cleanMetadata).length > 0 && {
          metadata: cleanMetadata,
        }),
      };

      // Incluir paginación si existe
      if (metadata.pagination) {
        response.pagination = metadata.pagination;
      }

      // Log con mensaje traducido
      logger.info(this.getTranslation(req, "logs:success_response"), {
        status: response.status,
        title: response.title,
        message: response.message,
        hasData: !!data,
        timestamp: new Date().toISOString(),
        language: req?.language || "es",
      });

      return res.status(response.status).json(response);
    } catch (error) {
      logger.error(this.getTranslation(req, "logs:critical_error"), {
        error: error.message,
        stack: error.stack,
        serviceResponse: serviceResponse,
        language: req?.language || "es",
      });

      return this.respuestaError(
        res,
        {
          status: 500,
          title: this.getTranslation(req, "error:controller"),
          message: this.getTranslation(req, "error:internal_server"),
          error: error.message,
        },
        req
      );
    }
  }

  /**
   * @static
   * @method respuestaError
   * @description Devuelve una respuesta de error estructurada
   * @param {Object} res Objeto response de Express
   * @param {Object} serviceResponse Respuesta de error del servicio
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Object} Respuesta de error estructurada para el frontend
   */
  static async respuestaError(res, serviceResponse, req = null) {
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
        logger.warn(this.getTranslation(req, "logs:client_error"), {
          status: serviceResponse.status,
          title: serviceResponse.title,
          message: serviceResponse.message,
          errorCode: serviceResponse.error?.code,
          timestamp: new Date().toISOString(),
          language: req?.language || "es",
        });

        // Caso específico: Validación
        if (
          serviceResponse.error?.code === "VALIDATION_ERROR" ||
          serviceResponse.error?.details?.validationErrors
        ) {
          return this.respuestaValidacionError(res, serviceResponse, req);
        }

        // Para otros errores 4xx, mostrar el mensaje original
        const status = serviceResponse.status || 400;

        const response = {
          success: false,
          status: status,
          title: serviceResponse.title || this.getDefaultTitle(status, req),
          message:
            serviceResponse.message || this.getTranslation(req, "error:client"),
          error: serviceResponse.error?.details || {},
        };

        return res.status(status).json(response);
      }

      // Si es una instancia de Error nativa
      if (serviceResponse instanceof Error) {
        logger.error("🔍 Error nativo capturado", {
          message: serviceResponse.message,
          stack: serviceResponse.stack,
          name: serviceResponse.name,
          language: req?.language || "es",
        });

        return this.respuestaError(
          res,
          {
            status: 500,
            title: this.getTranslation(req, "error:controller"),
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
          },
          req
        );
      }

      // Para errores 500 (sin detalles al usuario)
      if (serviceResponse.status === 500 || !serviceResponse.status) {
        logger.error(this.getTranslation(req, "logs:server_error"), {
          status: 500,
          title: serviceResponse.title,
          message: serviceResponse.message,
          errorCode: serviceResponse.error?.code,
          stack: serviceResponse.error?.details?.stack,
          timestamp: new Date().toISOString(),
          language: req?.language || "es",
        });

        const response = {
          success: false,
          status: 500,
          title: this.getTranslation(req, "error:controller"),
          message: this.getTranslation(req, "error:internal_server"),
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

      logger.error(this.getTranslation(req, "logs:generic_error"), {
        status: status,
        title: serviceResponse.title,
        message: serviceResponse.message,
        errorDetails: serviceResponse.error?.details,
        timestamp: new Date().toISOString(),
        language: req?.language || "es",
      });

      const response = {
        success: false,
        status: status,
        title: serviceResponse.title || this.getDefaultTitle(status, req),
        message:
          serviceResponse.message ||
          this.getTranslation(req, "error:internal_server"),
        error: serviceResponse.error?.details,
      };

      return res.status(status).json(response);
    } catch (internalError) {
      logger.error(this.getTranslation(req, "logs:critical_error"), {
        error: internalError.message,
        stack: internalError.stack,
        serviceResponse: serviceResponse,
        timestamp: new Date().toISOString(),
        language: req?.language || "es",
      });

      return res.status(500).json({
        success: false,
        status: 500,
        title: this.getTranslation(req, "error:critical"),
        message: this.getTranslation(req, "error:internal_server"),
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
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Object} Respuesta de validación estructurada
   */
  static respuestaValidacionError(res, serviceResponse, req = null) {
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
      title:
        serviceResponse.title || this.getTranslation(req, "error:validation"),
      message:
        serviceResponse.message ||
        this.getTranslation(req, "error:invalid_data"),
      data: null,
      error: {
        validationErrors: this.formatValidationErrors(validationErrors, req),
        totalErrors: validationErrors.length,
      },
    };

    logger.warn(this.getTranslation(req, "logs:validation_error"), {
      status: 400,
      title: response.title,
      message: response.message,
      totalErrors: validationErrors.length,
      validationErrors: validationErrors,
      timestamp: new Date().toISOString(),
      language: req?.language || "es",
    });

    return res.status(400).json(response);
  }

  /**
   * @static
   * @method formatValidationErrors
   * @description Formatea los errores de validación para una estructura consistente
   * @param {Array|Object} errors Errores de validación
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Array} Errores formateados
   */
  static formatValidationErrors(errors, req = null) {
    if (!errors) return [];

    if (Array.isArray(errors)) {
      return errors.map((error) => ({
        field: error.field || error.path || "unknown",
        message:
          error.message ||
          this.getTranslation(req, "validation:default_message"),
        value: error.value !== undefined ? error.value : null,
        type: error.type || "validation",
      }));
    }

    if (typeof errors === "object") {
      return Object.keys(errors).map((key) => ({
        field: key,
        message:
          errors[key].message ||
          errors[key] ||
          this.getTranslation(req, "validation:default_message"),
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
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Object} Respuesta estructurada
   */
  static respuestaServicio(res, serviceResponse, req = null) {
    try {
      if (!serviceResponse) {
        logger.error(this.getTranslation(req, "logs:service_error"));
        return this.respuestaError(
          res,
          {
            status: 500,
            title: this.getTranslation(req, "error:service"),
            message: this.getTranslation(req, "logs:service_error"),
          },
          req
        );
      }

      if (serviceResponse.success === true) {
        return this.respuestaExito(res, serviceResponse, req);
      } else {
        return this.respuestaError(res, serviceResponse, req);
      }
    } catch (error) {
      logger.error(this.getTranslation(req, "logs:processing_error"), {
        error: error.message,
        stack: error.stack,
        language: req?.language || "es",
      });

      return this.respuestaError(
        res,
        {
          status: 500,
          title: this.getTranslation(req, "error:controller"),
          message: this.getTranslation(req, "logs:processing_error"),
          error: error.message,
        },
        req
      );
    }
  }

  /**
   * @static
   * @method manejarServicio
   * @description Método optimizado para manejar servicios con propagación automática
   * @param {Object} res Objeto response de Express
   * @param {Promise} servicioPromise Promesa del servicio
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Object} Respuesta estructurada
   */
  static async manejarServicio(res, servicioPromise, req = null) {
    try {
      const resultado = await servicioPromise;
      console.log(resultado)
      if (resultado === undefined || resultado === null) {
        logger.error(this.getTranslation(req, "logs:null_result"));
        return this.respuestaError(
          res,
          {
            status: 500,
            title: this.getTranslation(req, "error:service"),
            message: this.getTranslation(req, "logs:null_result"),
          },
          req
        );
      }

      if (resultado.success === false) {
        throw resultado;
      }
      return this.respuestaExito(res, resultado, req);
    } catch (error) {
      logger.error(this.getTranslation(req, "logs:processing_error"), {
        error: error.message,
        stack: error.stack,
        language: req?.language || "es",
      });
      return this.respuestaError(res, error, req);
    }
  }

  /**
   * @static
   * @method respuestaDatos
   * @description Versión simplificada para respuestas solo con datos
   * @param {Object} res Objeto response de Express
   * @param {Object} data Datos a enviar
   * @param {Object} metadata Metadatos adicionales
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Object} Respuesta estructurada
   */
  static respuestaDatos(res, data, metadata = {}, req = null) {
    logger.info(this.getTranslation(req, "logs:data_response"), {
      dataType: typeof data,
      hasMetadata: Object.keys(metadata).length > 0,
      timestamp: new Date().toISOString(),
      language: req?.language || "es",
    });

    return this.respuestaExito(
      res,
      {
        status: 200,
        success: true,
        message:
          metadata.message ||
          this.getTranslation(req, "success:data_retrieved"),
        data: data,
        metadata: metadata,
      },
      req
    );
  }

  /**
   * @static
   * @method respuestaPaginada
   * @description Respuesta específica para datos paginados
   * @param {Object} res Objeto response de Express
   * @param {Array} data Datos de la página actual
   * @param {Object} pagination Información de paginación
   * @param {string} message Mensaje personalizado
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {Object} Respuesta paginada estructurada
   */
  static respuestaPaginada(res, data, pagination, message = null, req = null) {
    logger.info(this.getTranslation(req, "logs:paged_response"), {
      dataCount: data?.length || 0,
      pagination: pagination,
      timestamp: new Date().toISOString(),
      language: req?.language || "es",
    });

    const translatedMessage =
      message || this.getTranslation(req, "success:paged_data");

    return this.respuestaExito(
      res,
      {
        status: 200,
        success: true,
        message: translatedMessage,
        data: data,
        metadata: {
          pagination: pagination,
          title: "Datos Paginados", // Este podría también traducirse
        },
      },
      req
    );
  }

  /**
   * @static
   * @method getDefaultTitle
   * @description Obtiene título por defecto basado en el código de estado
   * @param {number} status Código HTTP
   * @param {Object} req Objeto request de Express (opcional, para i18n)
   * @returns {string} Título descriptivo
   */
  static getDefaultTitle(status, req = null) {
    const titleKey = `http:${status}`;
    return (
      this.getTranslation(req, titleKey) ||
      this.getTranslation(req, "error:client")
    );
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
