import FormatResponseController from "../utils/FormatterResponseController.js";
import ProfesorService from "../services/profesor.service.js";

/**
 * @class ProfesorController
 * @description Controlador para gestionar las operaciones relacionadas con profesores
 */
export default class ProfesorController {
  /**
   * @name registrarProfesor
   * @description Registrar un nuevo profesor en el sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registrarProfesor(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.registrarProfesor(req.body, req.file, req.user)
    );
  }

  /**
   * @name mostrarProfesorAPI
   * @description Obtener listado de profesores en formato API
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarProfesorAPI(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.obtenerConFiltros(req.query)
    );
  }

  /**
   * @name getImageProfesorDirect
   * @description Obtener la imagen de un profesor
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async getImageProfesorDirect(req, res) {
    try {
      const { id } = req.params;
      console.log(req.query);
      const respuesta = await ProfesorService.obtenerImagenProfesor(
        id,
        req.query
      );

      const imagenData = respuesta.data;

      let bufferToSend;

      // CASO 1: Si es un objeto Buffer de Node.js con estructura {type: "Buffer", data: [...]}
      if (
        imagenData.buffer &&
        imagenData.buffer.type === "Buffer" &&
        Array.isArray(imagenData.buffer.data)
      ) {
        console.log("✅ Convirtiendo Buffer object a Buffer nativo");
        bufferToSend = Buffer.from(imagenData.buffer.data);
      }
      // CASO 2: Si ya es un Buffer nativo de Node.js
      else if (Buffer.isBuffer(imagenData.buffer)) {
        console.log("✅ Usando Buffer nativo directamente");
        bufferToSend = imagenData.buffer;
      }
      // CASO 3: Si es un array de números directamente
      else if (Array.isArray(imagenData.buffer)) {
        console.log("✅ Convirtiendo array a Buffer");
        bufferToSend = Buffer.from(imagenData.buffer);
      } else {
        throw new Error("Formato de buffer no reconocido");
      }

      // Verificar que el buffer no esté vacío
      if (!bufferToSend || bufferToSend.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Buffer de imagen vacío",
        });
      }

      // Configurar headers para la respuesta de imagen
      res.set({
        "Content-Type": imagenData.mimeType || "image/webp",
        "Content-Length": bufferToSend.length,
        "Content-Disposition": `inline; filename="${imagenData.fileName}"`,
        "Cache-Control": "public, max-age=86400",
        // Eliminar ETag si causa problemas
      });

      console.log("📤 Enviando buffer:", {
        size: bufferToSend.length,
        type: imagenData.mimeType,
        primerosBytes: Array.from(bufferToSend.slice(0, 4)),
      });

      // ✅ Enviar el BUFFER convertido correctamente
      res.send(bufferToSend);
    } catch (error) {
      console.error("❌ Error en getImageProfesorDirect:", error);
      FormatResponseController.respuestaError(res, error);
    }
  }

  /**
   * @name mostrarProfesor
   * @description Obtener listado de profesores para interfaz web
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarProfesor(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.obtenerProfesores(req.query)
    );
  }

  /**
   * @name mostrarProfesoresEliminados
   * @description Obtener listado de profesores eliminados para interfaz web
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarProfesoresEliminados(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.mostrarProfesoresEliminados(req.query)
    );
  }

  /**
   * @name mostrarDisponibilidad
   * @description Obtener disponibilida de un profesor
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarDisponibilidad(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.mostrarDisponibilidad(req.params.id)
    );
  }

  /**
   * @name buscarProfesor
   * @description Buscar profesores según criterios específicos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async buscarProfesor(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.buscar(req.body)
    );
  }

  /**
   * @name mostrarPreGrados
   * @description Obtener los pre-grados existentes
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarPreGrados(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.obtenerPregrados()
    );
  }

  /**
   * @name mostrarPosGrados
   * @description Obtener los pos-grados existentes
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarPosGrados(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.obtenerPosgrados()
    );
  }

  /**
   * @name mostrarAreasConocimiento
   * @description Obtener las áreas de conocimiento existentes
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarAreasConocimiento(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.obtenerAreasConocimiento()
    );
  }

  /**
   * @name registerPreGrado
   * @description Registrar un nuevo pre-grado
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registerPreGrado(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.crearPregrado(req.body, req.user)
    );
  }

  /**
   * @name registerPosGrado
   * @description Registrar un nuevo pos-grado
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registerPosGrado(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.crearPosgrado(req.body, req.user)
    );
  }

  /**
   * @name registerAreaConocimiento
   * @description Registrar una nueva área de conocimiento
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registerAreaConocimiento(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.crearAreaConocimiento(req.body, req.user)
    );
  }

  /**
   * @name crearDisponibilidad
   * @description Crear nueva disponibilidad docente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async crearDisponibilidad(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.crearDisponibilidad(
        req.params.id_profesor,
        req.body,
        req.user
      )
    );
  }

  /**
   * @name actualizarDisponibilidad
   * @description Actualizar disponibilidad docente existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarDisponibilidad(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.actualizarDisponibilidad(
        req.params.id_profesor,
        req.body,
        req.user
      )
    );
  }

  /**
   * @name eliminarDisponibilidad
   * @description Eliminar disponibilidad docente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async eliminarDisponibilidad(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.eliminarDisponibilidad(
        req.params.id_profesor,
        req.params.id_disponibilidad,
        req.user
      )
    );
  }

  /**
   * @name actualizarProfesor
   * @description Actualizar información de un profesor
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarProfesor(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.actualizar(req.params.id, req.body, req.user.id)
    );
  }

  /**
   * @name destituirProfesor
   * @description Destituir/eliminar un profesor
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async destituirProfesor(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.destituirProfesor(req.body, req.user)
    );
  }

  /**
   * @name reingresoProfesor
   * @description Destituir/eliminar un profesor
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async reingresoProfesor(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      ProfesorService.reingresoProfesor(req.body, req.user)
    );
  }
}
