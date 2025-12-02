import FormatResponseController from "../utils/FormatterResponseController.js";
import AulaService from "../services/aulas.service.js";

/**
 * @class AulaController
 * @description Controlador para gestionar las operaciones relacionadas con aulas
 */
export default class AulaController {
  /**
   * @name registerAula
   * @description Registrar una nueva aula
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registerAula(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.registrarAula(req.body, req.user)
    );
  }

  /**
   * @name mostrarAulas
   * @description Obtener todas las aulas registradas
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarAulas(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.mostrarAulas()
    );
  }

  /**
   * @name obtenerAulaPorId
   * @description Obtener una aula específica por ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerAulaPorId(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.obtenerAulaPorId(parseInt(req.params.id))
    );
  }

  /**
   * @name actualizarAula
   * @description Actualizar una aula existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarAula(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.actualizarAula(parseInt(req.params.id), req.body, req.user)
    );
  }

  /**
   * @name eliminarAula
   * @description Eliminar una aula específica
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async eliminarAula(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.eliminarAula(parseInt(req.params.id), req.user)
    );
  }

  /**
   * @name obtenerAulasPorTipo
   * @description Obtener aulas filtradas por tipo
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerAulasPorTipo(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.obtenerAulasPorTipo(req.params.tipo)
    );
  }

  /**
   * @name obtenerAulasPorSede
   * @description Obtener aulas filtradas por sede
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerAulasPorSede(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.obtenerAulasPorSede(req.query, req.params.id_sede)
    );
  }

  /**
   * @name obtenerAulasPorPnf
   * @description Obtener aulas filtradas por sede
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerAulasPorPnf(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AulaService.obtenerAulasPorPnf(req.params.codigoPNF)
    );
  }
}
