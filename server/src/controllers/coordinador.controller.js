import FormatResponseController from "../utils/FormatterResponseController.js";
import CoordinadorService from "../services/coordinador.service.js";

/**
 * @class CoordinadorController
 * @description Controlador para gestionar las operaciones relacionadas con coordinadores
 */
export default class CoordinadorController {
  /**
   * @name asignarCoordinador
   * @description Asigna un profesor como coordinador de un PNF
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async asignarCoordinador(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CoordinadorService.asignarCoordinador(req.body, req.user)
    );
  }
  /**
   * @name reasignarCoordinador
   * @description Reasigna un coordinador existente a otro PNF
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async reasignarCoordinador(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CoordinadorService.reasignarCoordinador(req.body, req.user)
    );
  }

  /**
   * @name listarCoordinadores
   * @description Obtiene el listado de todos los coordinadores
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async listarCoordinadores(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CoordinadorService.listarCoordinadores(req.query)
    );
  }
  /**
   * @name listarCoordinadoresDestituidos
   * @description Obtiene el listado de todos los coordinadores destituidos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async listarCoordinadoresDestituidos(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CoordinadorService.listarCoordinadoresDestituidos(req.query)
    );
  }

  /**
   * @name obtenerCoordinador
   * @description Obtiene los detalles de un coordinador específico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerCoordinador(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CoordinadorService.obtenerCoordinador(parseInt(req.params.cedula))
    );
  }

  /**
   * @name actualizarCoordinador
   * @description Actualiza los datos de un coordinador existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarCoordinador(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CoordinadorService.actualizarCoordinador(
        parseInt(req.params.id),
        req.body,
        req.user
      )
    );
  }

  /**
   * @name eliminarCoordinador
   * @description Elimina un coordinador (destitución)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async eliminarCoordinador(req, res) {
    try {
      const { id } = req.params;
      const user_action = req.user;

      return FormatResponseController.manejarServicio(
        res,
        await CoordinadorService.eliminarCoordinador(
          parseInt(id),
          user_action,
          req.body
        )
      );
    } catch (error) {
      console.error("💥 Error en controlador eliminarCoordinador:", error);
      return FormatResponseController.error(
        res,
        "Error interno del servidor al procesar la destitución",
        500
      );
    }
  }
  /**
   * @name restituirCoordinador
   * @description Restituye (reingresa) un coordinador destituido
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async restituirCoordinador(req, res) {
    try {
      const { id } = req.params;
      const user_action = req.user;

      // Validar que el ID esté presente
      if (!id) {
        return FormatResponseController.error(
          res,
          "ID de coordinador es requerido",
          400
        );
      }

      // Obtener datos de restitución del body
      const {
        tipo_reingreso = "REINGRESO",
        motivo_reingreso,
        observaciones = "",
        fecha_efectiva = new Date().toISOString().split("T")[0],
        registro_anterior_id = null,
        id_pnf = null,
      } = req.body;

      // Validar datos requeridos
      if (!motivo_reingreso || motivo_reingreso.trim() === "") {
        return FormatResponseController.error(
          res,
          "El motivo del reingreso es requerido",
          400
        );
      }

      const dataRestitucion = {
        tipo_reingreso,
        motivo_reingreso: motivo_reingreso.trim(),
        observaciones: observaciones.trim(),
        fecha_efectiva,
        registro_anterior_id,
        id_pnf,
      };

      return FormatResponseController.manejarServicio(
        res,
        await CoordinadorService.restituirCoordinador(
          parseInt(id),
          user_action,
          dataRestitucion
        )
      );
    } catch (error) {
      console.error("💥 Error en controlador restituirCoordinador:", error);
      return FormatResponseController.error(
        res,
        "Error interno del servidor al procesar la restitución",
        500
      );
    }
  }
  /**
   * @name obtenerHistorialDestituciones
   * @description Obtiene el historial de destituciones de un coordinador
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerHistorialDestituciones(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return FormatResponseController.error(
          res,
          "ID de coordinador es requerido",
          400
        );
      }

      return FormatResponseController.manejarServicio(
        res,
        await CoordinadorService.obtenerHistorialDestituciones(
          parseInt(id),
          req.user
        )
      );
    } catch (error) {
      console.error(
        "💥 Error en controlador obtenerHistorialDestituciones:",
        error
      );
      return FormatResponseController.error(
        res,
        "Error interno del servidor al obtener el historial",
        500
      );
    }
  }
}
