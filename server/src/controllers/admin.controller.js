import FormatResponseController from "../utils/FormatterResponseController.js";
import AdminService from "../services/admin.service.js";

/**
 * @class AdminController
 * @description Controlador para gestionar las operaciones relacionadas con administradores
 */
export default class AdminController {
  /**
   * @name registrarAdmin
   * @description Registrar un nuevo administrador
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registrarAdmin(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.registrarAdmin(req.body, req.file, req.user)
    );
  }

  /**
   * @name mostrarAdmin
   * @description Obtener todos los administradores registrados
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarAdmin(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.mostrarAdmin(req.query)
    );
  }

  /**
   * @name buscarAdmin
   * @description Buscar administradores por cédula, nombre, email o apellido
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async buscarAdmin(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.buscarAdmin(req.query.busqueda)
    );
  }

  /**
   * @name actualizarAdmin
   * @description Actualizar un administrador existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarAdmin(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.actualizarAdmin(
        parseInt(req.params.id),
        req.body,
        req.user,
        req
      )
    );
  }

  /**
   * @name desactivarAdmin
   * @description Desactivar un administrador (eliminación lógica)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async desactivarAdmin(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.desactivarAdmin(parseInt(req.params.id), req.user)
    );
  }

  /**
   * @name cambiarRolAdmin
   * @description Cambiar el rol de un administrador
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async cambiarRolAdmin(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.cambiarRolAdmin(
        parseInt(req.params.id),
        req.body.roles,
        req.user,
        req
      )
    );
  }
  /**
   * @name getProfile
   * @description Obtener el perfil del administrador autenticado
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async getProfile(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.getProfile(req.user)
    );
  }

  /**
   * @name updateProfile
   * @description Actualizar el perfil del administrador autenticado
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async updateProfile(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.updateProfile(req.user, req.body)
    );
  }

  /**
   * @name obtenerAdminPorId
   * @description Obtener un administrador específico por ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerAdminPorId(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.obtenerAdminPorId(parseInt(req.params.id))
    );
  }

  /**
   * @name obtenerAdminsPorRol
   * @description Obtener administradores filtrados por rol
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerAdminsPorRol(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.obtenerAdminsPorRol(req.params.rol)
    );
  }

  /**
   * @name obtenerAdminsPorEstado
   * @description Obtener administradores filtrados por estado
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerAdminsPorEstado(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      AdminService.obtenerAdminsPorEstado(req.params.estado)
    );
  }
}
