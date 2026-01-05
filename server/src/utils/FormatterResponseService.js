/**
 * @class FormatterResponseService
 * @description Clase utilitaria para estandarizar las respuestas de los servicios hacia los controladores.
 * Proporciona métodos para formatear respuestas exitosas, errores y manejar estados de manera consistente.
 */
export default class FormatterResponseService {
  /**
   * @static
   * @method success
   * @description Formatea una respuesta exitosa del servicio
   * @param {Object} data - Datos a retornar
   * @param {string} [message='Operación completada'] - Mensaje descriptivo
   * @param {Object} [metadata={}] - Metadatos adicionales
   * @returns {Object} Respuesta formateada
   */
  static success(data = null, message = "Operación completada", metadata = {}) {
    return {
      success: true,
      status: metadata.status || 200,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }

  /**
   * @static
   * @method created
   * @description Formatea respuesta para creación exitosa de recursos
   * @param {Object} data - Datos del recurso creado
   * @param {string} [message='Recurso creado exitosamente'] - Mensaje descriptivo
   * @param {string} [resourceId=null] - ID del recurso creado
   * @returns {Object} Respuesta formateada
   */
  static created(
    data = null,
    message = "Recurso creado exitosamente",
    resourceId = null
  ) {
    const metadata = {
      status: 201,
      ...(resourceId && { resourceId }),
    };

    return this.success(data, message, metadata);
  }

  /**
   * @static
   * @method paginated
   * @description Formatea respuesta paginada
   * @param {Array} data - Datos de la página actual
   * @param {number} page - Página actual
   * @param {number} limit - Límite por página
   * @param {number} total - Total de elementos
   * @param {string} [message='Datos obtenidos exitosamente'] - Mensaje descriptivo
   * @returns {Object} Respuesta paginada formateada
   */
  static paginated(
    data,
    page,
    limit,
    total,
    message = "Datos obtenidos exitosamente"
  ) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const metadata = {
      status: 200,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null,
      },
    };

    return this.success(data, message, metadata);
  }

  /**
   * @static
   * @method error
   * @description Formatea y LANZA una respuesta de error del servicio
   * @param {string} title - Título del error
   * @param {string} message - Mensaje de error
   * @param {number} [status=500] - Código de estado HTTP
   * @param {string} [code='INTERNAL_ERROR'] - Código de error interno
   * @param {Object} [details={}] - Detalles adicionales del error
   * @throws {Object} Error formateado para propagación automática
   */
  static error(
    title,
    message,
    status = 500,
    code = "INTERNAL_ERROR",
    details = {}
  ) {
    const errorObj = {
      title: title,
      success: false,
      status,
      message,
      error: {
        code,
        details,
        timestamp: new Date().toISOString(),
      },
    };
    
    return errorObj; // ← PROPAGACIÓN AUTOMÁTICA
  }

  /**
   * @static
   * @method notFound
   * @description Formatea respuesta para recurso no encontrado
   * @param {string} [resource='Recurso'] - Nombre del recurso no encontrado
   * @param {string} [id=null] - ID del recurso no encontrado
   * @throws {Object} Error 404 formateado
   */
  static notFound(resource = "Recurso", id = null) {
    const message = id
      ? `${resource} con ID ${id} no encontrado`
      : `${resource} no encontrado`;

    this.error( // ← SIN return, se propaga automáticamente
      "Recurso No Encontrado",
      message,
      404,
      "RESOURCE_NOT_FOUND",
      { resource, id }
    );
  }

  /**
   * @static
   * @method validationError
   * @description Formatea y LANZA errores de validación
   * @param {Array|Object} errors - Errores de validación
   * @param {string} [message='Error de validación'] - Mensaje general
   * @throws {Object} Error de validación formateado
   */
  static validationError(errors, message = "Error de validación") {
    const error = this.error( // ← SIN return, se propaga automáticamente
      "Error de Validación",
      message,
      400,
      "VALIDATION_ERROR",
      {
        validationErrors: errors,
      }
    );
    return error;
  }

  /**
   * @static
   * @method unauthorized
   * @description Formatea respuesta de no autorizado
   * @param {string} [message='No autorizado'] - Mensaje de error
   * @throws {Object} Error 401 formateado
   */
  static unauthorized(message = "No autorizado") {
   return this.error( // ← SIN return
      "No Autorizado",
      message,
      401,
      "UNAUTHORIZED"
    );
  }

  /**
   * @static
   * @method forbidden
   * @description Formatea respuesta de prohibido
   * @param {string} [message='Acceso prohibido'] - Mensaje de error
   * @throws {Object} Error 403 formateado
   */
  static forbidden(message = "Acceso prohibido") {
    this.error( // ← SIN return
      "Acceso Prohibido",
      message,
      403,
      "FORBIDDEN"
    );
  }

  /**
   * @static
   * @method conflict
   * @description Formatea respuesta de conflicto (ej: recurso duplicado)
   * @param {string} message - Mensaje de conflicto
   * @param {Object} [details={}] - Detalles del conflicto
   * @throws {Object} Error 409 formateado
   */
  static conflict(message, details = {}) {
    this.error( // ← SIN return
      "Conflicto",
      message,
      409,
      "CONFLICT",
      details
    );
  }

  /**
   * @static
   * @method fromDatabaseResponse
   * @description Adapta la respuesta del modelo (FormatResponseModel) para el servicio
   * @param {Object} dbResponse - Respuesta formateada del modelo
   * @returns {Object} Respuesta adaptada para el servicio
   * @throws {Object} Error si la respuesta de la base de datos es un error
   */
  static fromDatabaseResponse(dbResponse) {
    if (dbResponse.state === "error") {
      this.error( // ← SIN return, se propaga automáticamente
        dbResponse.title || "Error de Base de Datos",
        dbResponse.message,
        dbResponse.status || 500,
        "DATABASE_ERROR",
        {
          originalError: dbResponse,
        }
      );
    }


    return this.success(dbResponse.data, dbResponse.message, {
      status: dbResponse.status,
      title: dbResponse.title,
      ...dbResponse.metadata,
    });
  }

  /**
   * @static
   * @method isSuccess
   * @description Verifica si una respuesta es exitosa
   * @param {Object} response - Respuesta a verificar
   * @returns {boolean} True si es exitosa
   */
  static isSuccess(response) {
    return response && response.success === true;
  }

  /**
   * @static
   * @method isError
   * @description Verifica si una respuesta es de error
   * @param {Object} response - Respuesta a verificar
   * @returns {boolean} True si es error
   */
  static isError(response) {
    return response && response.success === false;
  }

  /**
   * @static
   * @method extractData
   * @description Extrae datos de una respuesta exitosa
   * @param {Object} response - Respuesta del servicio
   * @returns {*} Datos extraídos o null si es error
   */
  static extractData(response) {
    return this.isSuccess(response) ? response.data : null;
  }

  /**
   * @static
   * @method extractError
   * @description Extrae información de error de una respuesta
   * @param {Object} response - Respuesta del servicio
   * @returns {Object|null} Información del error o null si es exitosa
   */
  static extractError(response) {
    return this.isError(response) ? response.error : null;
  }
}