import FormatResponseController from "../utils/FormatterResponseController.js";
import HorarioService from "../services/horario.service.js";

/**
 * @class HorarioController
 * @description Controlador para gestionar las operaciones relacionadas con horarios académicos
 */
export default class HorarioController {
  /**
   * @name obtenerHorariosPorSeccion
   * @description Obtener horarios por sección específica
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerHorariosPorSeccion(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.mostrarHorariosPorSeccion(parseInt(req.params.id_seccion))
    );
  }

  /**
   * @name obtenerHorariosPorProfesor
   * @description Obtener horarios por profesor específico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerHorariosPorProfesor(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.mostrarHorariosProfesores(parseInt(req.params.id_profesor))
    );
  }

  /**
   * @name obtenerHorariosPorAula
   * @description Obtener horarios por aula específica
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerHorariosPorAula(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.mostrarHorariosPorAula(parseInt(req.params.id_aula))
    );
  }

  /**
   * @name mostrarAulasParaHorario
   * @description Obtener información de aulas disponibles para la creación de un nuevo horario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarAulasParaHorario(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.mostrarAulasParaHorario(
        parseInt(req.params.id_seccion),
        parseInt(req.body.horas_necesarias),
        parseInt(req.body.id_profesor),
        req.body.id_unidad_curricular
          ? parseInt(req.body.id_unidad_curricular)
          : null,
        req.body.search
      )
    );
  }

  /**
   * @name mostrarProfesoresParaHorario
   * @description Obtener información de profesores para la creación de un nuevo horario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarProfesoresParaHorario(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.mostrarProfesoresParaHorario(
        parseInt(req.params.id_seccion),
        parseInt(req.body.horas_necesarias),
        req.body.id_unidad_curricular
          ? parseInt(req.body.id_unidad_curricular)
          : null,
        req.body.search ? req.body.search : null
      )
    );
  }

  /**
   * @name mostrarAulaCambiarHorario
   * @description Obtener información de profesores para la creación de un nuevo horario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarAulaCambiarHorario(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.mostrarAulaCambiarHorario(parseInt(req.params.id_aula))
    );
  }

  /**
   * @name mostrarProfesorCambiarHorario
   * @description Obtener información de profesores para la creación de un nuevo horario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async mostrarProfesorCambiarHorario(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.mostrarProfesorCambiarHorario(
        parseInt(req.params.id_profesor)
      )
    );
  }

  /**
   * @name registrarHorario
   * @description Crear un nuevo horario académico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async registrarHorario(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.registrarHorario(req.body, req.user)
    );
  }

  /**
   * @name actualizarHorario
   * @description Actualizar un horario existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async actualizarHorario(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.actualizarHorario(req.params.id, req.body, req.user)
    );
  }

  /**
   * @name eliminarHorario
   * @description Eliminar un horario específico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async eliminarHorario(req, res) {
    return FormatResponseController.manejarServicio(
      res,
      HorarioService.eliminarHorario(parseInt(req.params.id_horario), req.user)
    );
  }

  /**
   * @name exportarHorarioWord
   * @description Exportar horario de una sección específica a Word
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */

  static async exportarHorarioWord(req, res) {
    try {
      const { id_seccion } = req.params;

      console.log("📥 Exportando horario para sección:", id_seccion);

      // 1. Primero obtener los datos del horario formateados
      const horarioResponse = await HorarioService.generarDocumentoHorario(
        parseInt(id_seccion)
      );

      console.log("✅ Documento generado exitosamente", horarioResponse);
      const { buffer, fileName } = horarioResponse.data;
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });

      console.log(
        `📤 Enviando documento: ${fileName} (${buffer.length} bytes)`
      );

      // 6. Enviar el buffer
      res.send(buffer);
    } catch (error) {
      console.error("❌ Error en exportarHorarioWord:", error);

      // Si ya se enviaron headers, no intentar enviar JSON
      if (res.headersSent) {
        console.log("⚠️ Headers ya enviados, cerrando conexión");
        return res.end();
      }

      FormatResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Servidor",
        message: "Error al generar el documento de horario",
        error: error.message,
      });
    }
  }
}
