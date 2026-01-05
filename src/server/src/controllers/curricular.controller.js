import FormatResponseController from "../utils/FormatterResponseController.js";
import CurricularService from "../services/curricular.service.js";

/**
 * @class CurricularController
 * @description Controlador para gestionar las operaciones relacionadas con:
 * - Programas Nacionales de Formación (PNF)
 * - Unidades Curriculares
 * - Trayectos académicos
 * - Secciones
 */
export default class CurricularController {
  /**
   * @name regitrarPNF
   * @description Registrar un nuevo Programa Nacional de Formación (PNF)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async regitrarPNF(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.registrarPNF(req.body, req.user)
    );
  }

  /**
   * @name regitrarUnidadCurricular
   * @description Registrar una nueva Unidad Curricular
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async regitrarUnidadCurricular(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.registrarUnidadCurricular(
        req.params.idTrayecto,
        req.body,
        req.user
      )
    );
  }

  /**
   * @name regitrarUnidadCurricular
   * @description Registrar una nueva Unidad Curricular
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registrarLineaInvestigacion(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.registrarLineaInvestigacion(
        req.body,
        req.user,
        req.params.idTrayecto
      )
    );
  }
  /**
   * @name mostrarLineasInvestigacion
   * @description Obtiene las líneas de investigación (opcionalmente filtradas por trayecto)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarLineasInvestigacion(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.mostrarLineasInvestigacion(
        req.params.idTrayecto || null
      )
    );
  }

  /**
   * @static
   * @async
   * @method eliminarUnidadCurricular
   * @description Controlador para eliminar una unidad curricular
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async eliminarUnidadCurricular(req, res) {
    try {
      const { id_unidad_curricular } = req.params;
      const user_action = req.user; // Asumiendo que el usuario viene del middleware de auth

      return FormatResponseController.manejarServicio(
        res,
        await CurricularService.eliminarUnidadCurricular(
          parseInt(id_unidad_curricular),
          user_action
        )
      );
    } catch (error) {
      console.error("Error en controller eliminarUnidadCurricular:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al eliminar la unidad curricular",
      });
    }
  }

  /**
   * @static
   * @async
   * @method eliminarPnf
   * @description Controlador para eliminar una unidad curricular
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async eliminarPnf(req, res) {
    try {
      const { id_pnf } = req.params;
      const user_action = req.user; // Asumiendo que el usuario viene del middleware de auth

      return FormatResponseController.manejarServicio(
        res,
        await CurricularService.eliminarPnf(
          parseInt(id_pnf),
          user_action
        )
      );
    } catch (error) {
      console.error("Error en controller eliminarPnf:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al eliminar la unidad curricular",
      });
    }
  }
  /**
   * @static
   * @async
   * @method reactivarPnf
   * @description Controlador para eliminar una unidad curricular
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async reactivarPnf(req, res) {
    try {
      const { id_pnf } = req.params;
      const user_action = req.user; // Asumiendo que el usuario viene del middleware de auth

      return FormatResponseController.manejarServicio(
        res,
        await CurricularService.reactivarPnf(
          parseInt(id_pnf),
          user_action
        )
      );
    } catch (error) {
      console.error("Error en controller reactivarPnf:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al eliminar la unidad curricular",
      });
    }
  }

  /**
   * @name actualizarPNF
   * @description Actualizar un Programa Nacional de Formación (PNF) existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarPNF(req, res) {
    const idPNF = parseInt(req.params.idPNF);

    return FormatResponseController.manejarServicio(
      res,
      CurricularService.actualizarPNF(idPNF, req.body, req.user)
    );
  }

  /**
   * @name actualizarDescripcionTrayecto
   * @description Actualizar la descripción de un trayecto específico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarDescripcionTrayecto(req, res) {
    const idTrayecto = parseInt(req.params.idTrayecto);

    return FormatResponseController.manejarServicio(
      res,
      CurricularService.actualizarDescripcionTrayecto(
        idTrayecto,
        req.body,
        req.user
      )
    );
  }

  /**
   * @name actualizarUnidadCurricular
   * @description Actualizar una Unidad Curricular existente (parcial o completamente)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarUnidadCurricular(req, res) {
    const id_unidad_curricular = parseInt(req.params.id_unidad_curricular);
    console.log(id_unidad_curricular);
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.actualizarUnidadCurricular(
        id_unidad_curricular,
        req.body,
        req.user
      )
    );
  }
  /**
   * @static
   * @async
   * @method eliminarUnidadCurricular
   * @description Controlador para eliminar una unidad curricular
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async eliminarUnidadCurricular(req, res) {
    try {
      const { id_unidad_curricular } = req.params;
      const user_action = req.user; // Asumiendo que el usuario viene del middleware de auth

      if (!id_unidad_curricular) {
        return res.status(400).json({
          success: false,
          message: "ID de unidad curricular es requerido",
        });
      }

      const resultado = await CurricularService.eliminarUnidadCurricular(
        parseInt(id_unidad_curricular),
        user_action
      );

      res.status(resultado.success ? 200 : 400).json(resultado);
    } catch (error) {
      console.error("Error en controller eliminarUnidadCurricular:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al eliminar la unidad curricular",
      });
    }
  }

  /**
   * @name mostrarPNF
   * @description Obtener todos los Programas Nacionales de Formación registrados
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarPNF(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.mostrarPNF(req.query)
    );
  }

  /**
   * @name mostrarTrayectos
   * @description Obtener todos los trayectos académicos registrados
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarTrayectos(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.mostrarTrayectos(req.params.codigoPNF)
    );
  }

  /**
   * @name mostrarUnidadesCurriculares
   * @description Obtener todas las unidades curriculares de un trayecto
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarUnidadesCurriculares(req, res) {
    const trayecto = req.params.idTrayecto
      ? Number(req.params.idTrayecto)
      : null;
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.mostrarUnidadesCurriculares(trayecto)
    );
  }

  /**
   * @name mostrarSecciones
   * @description Obtener todas las secciones de un trayecto
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarSecciones(req, res) {
    const trayecto = req.params.idTrayecto
      ? Number(req.params.idTrayecto)
      : null;
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.mostrarSecciones(trayecto)
    );
  }

  /**
   * @name mostrarSeccionesByPnfAndValueTrayecto
   * @description Obtener todas las secciones de un trayecto específico de un PNF
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarSeccionesByPnfAndValueTrayecto(req, res) {
    try {
      const { codigoPNF, valorTrayecto } = req.params;

      // Validar parámetros requeridos
      if (!codigoPNF || !valorTrayecto) {
        return res.status(400).json({
          success: false,
          message: "Los parámetros codigoPNF y valorTrayecto son requeridos",
          data: null,
        });
      }

      console.log("🔍 [Controlador] Obteniendo secciones...", {
        codigoPNF,
        valorTrayecto,
      });

      return FormatResponseController.manejarServicio(
        res,
        CurricularService.mostrarSeccionesByPnfAndValueTrayecto(
          codigoPNF,
          valorTrayecto
        )
      );
    } catch (error) {
      console.error("💥 Error en controlador mostrar secciones:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        data: null,
      });
    }
  }

  /**
   * @name mostrarSeccionesByPnfAndValueUnidadCurricular
   * @description Obtener todas las unidades curriculares de un trayecto específico de un PNF
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarSeccionesByPnfAndValueUnidadCurricular(req, res) {
    try {
      const { codigoPNF, valorTrayecto } = req.params;

      // Validar parámetros requeridos
      if (!codigoPNF || !valorTrayecto) {
        return res.status(400).json({
          success: false,
          message: "Los parámetros codigoPNF y valorTrayecto son requeridos",
          data: null,
        });
      }

      console.log("🔍 [Controlador] Obteniendo secciones...", {
        codigoPNF,
        valorTrayecto,
      });

      return FormatResponseController.manejarServicio(
        res,
        CurricularService.mostrarSeccionesByPnfAndValueUnidadCurricular(
          codigoPNF,
          valorTrayecto
        )
      );
    } catch (error) {
      console.error("💥 Error en controlador mostrar secciones:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        data: null,
      });
    }
  }

  /**
   * @name CrearSecciones
   * @description Crear secciones para un trayecto de forma automática
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async CrearSecciones(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.crearSecciones(
        parseInt(req.params.idTrayecto),
        req.body,
        req.user
      )
    );
  }

  /**
   * @name asignacionTurnoSeccion
   * @description Asignar un turno a una sección específica
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async asignacionTurnoSeccion(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      CurricularService.asignarTurnoSeccion(
        req.params.idSeccion,
        req.body,
        req.user
      )
    );
  }
}
