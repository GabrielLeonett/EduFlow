import FormatResponseController from "../utils/FormatterResponseController.js";
import SedeService from "../services/sedes.service.js";

/**
 * @class SedeController
 * @description Controlador para gestionar las operaciones relacionadas con sedes
 */
export default class SedeController {
  /**
   * @name registerSede
   * @description Registrar una nueva sede
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registerSede(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      SedeService.registrarSede(req.body, req.user)
    );
  }

  /**
   * @name mostrarSedes
   * @description Obtener todas las sedes registradas
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarSedes(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      SedeService.mostrarSedes()
    );
  }

  /**
   * @name obtenerSedePorId
   * @description Obtener una sede específica por ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerSedePorId(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      SedeService.obtenerSedePorId(parseInt(req.params.id))
    );
  }

  /**
   * @name actualizarSede
   * @description Actualizar una sede existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarSede(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      SedeService.actualizarSede(parseInt(req.params.id), req.body, req.user)
    );
  }

  /**
   * @name eliminarSede
   * @description Eliminar una sede específica
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async eliminarSede(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      SedeService.eliminarSede(parseInt(req.params.id), req.user)
    );
  }
}