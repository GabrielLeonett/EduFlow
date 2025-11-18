import SystemServices from "../services/system.service.js";
import fs from "fs-extra";
import path from "path";
import FormatterResponseController from "../utils/FormatterResponseController.js";

/**
 * @class SystemController
 * @description Controlador para gestionar las operaciones de respaldo, restauración y reportes del sistema
 */
export default class SystemController {
  /**
   * @name crearRespaldo
   * @description Crear un respaldo completo de la base de datos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async crearRespaldo(req, res) {
    try {
      console.log("🔧 Solicitando creación de respaldo del sistema...");
      const resultado = await SystemServices.crearRespaldo();

      // El servicio ya devuelve FormatterResponseService
      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en crearRespaldo controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al crear respaldo del sistema",
        error: error.message,
      });
    }
  }

  /**
   * @name listarRespaldos
   * @description Listar todos los respaldos disponibles
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async listarRespaldos(req, res) {
    try {
      console.log("📋 Solicitando listado de respaldos...");
      const resultado = await SystemServices.listarRespaldos();

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en listarRespaldos controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al listar respaldos del sistema",
        error: error.message,
      });
    }
  }

  /**
   * @name restaurarRespaldo
   * @description Restaurar la base de datos desde un respaldo
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async restaurarRespaldo(req, res) {
    try {
      const { backupFileName } = req.body;

      if (!backupFileName) {
        return FormatterResponseController.respuestaError(res, {
          status: 400,
          title: "Datos Inválidos",
          message: "El nombre del archivo de backup es requerido",
          error: "backupFileName es obligatorio"
        });
      }

      console.log(`🔄 Solicitando restauración desde: ${backupFileName}`);
      const resultado = await SystemServices.restaurarRespaldo(backupFileName);

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data
      });
    } catch (error) {
      console.error("❌ Error en restaurarRespaldo controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al restaurar respaldo del sistema",
        error: error.message,
      });
    }
  }

  /**
   * @name limpiarRespaldosAntiguos
   * @description Eliminar respaldos antiguos del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async limpiarRespaldosAntiguos(req, res) {
    try {
      const { dias } = req.query; // Cambiado de body a query para consistencia

      console.log(`🧹 Solicitando limpieza de respaldos antiguos...`);
      const resultado = await SystemServices.limpiarRespaldosAntiguos({ dias });

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data
      });
    } catch (error) {
      console.error("❌ Error en limpiarRespaldosAntiguos controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al limpiar respaldos antiguos",
        error: error.message,
      });
    }
  }

  /**
   * @name eliminarRespaldo
   * @description Eliminar un respaldo específico del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async eliminarRespaldo(req, res) {
    try {
      const { backupFileName } = req.params;

      console.log(`🧹 Solicitando eliminación del respaldo: ${backupFileName}...`);
      const resultado = await SystemServices.eliminarRespaldo(backupFileName);

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data
      });
    } catch (error) {
      console.error("❌ Error en eliminarRespaldo controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al eliminar respaldo",
        error: error.message,
      });
    }
  }

  /**
   * @name descargarRespaldo
   * @description Descargar un archivo de respaldo específico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async descargarRespaldo(req, res) {
    try {
      const { backupFileName } = req.params;

      if (!backupFileName) {
        return FormatterResponseController.respuestaError(res, {
          status: 400,
          title: "Datos Inválidos",
          message: "El nombre del archivo de backup es requerido",
          error: "backupFileName es obligatorio"
        });
      }

      const backupsDir = path.join(process.cwd(), 'src', 'database', 'backups');
      const backupPath = path.join(backupsDir, backupFileName);

      // Verificar que el archivo existe
      if (!await fs.pathExists(backupPath)) {
        return FormatterResponseController.respuestaError(res, {
          status: 404,
          title: "Archivo No Encontrado",
          message: `El archivo de backup ${backupFileName} no existe`,
          error: "Archivo no encontrado"
        });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
      
      // Stream el archivo al cliente
      const fileStream = fs.createReadStream(backupPath);
      fileStream.pipe(res);

      console.log(`📥 Descargando respaldo: ${backupFileName}`);

    } catch (error) {
      console.error("❌ Error en descargarRespaldo controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al descargar respaldo",
        error: error.message,
      });
    }
  }

  // 📊 MÉTODOS DE REPORTES Y ESTADÍSTICAS ACTUALIZADOS

  /**
   * @name obtenerReportesEstadisticas
   * @description Obtener reportes estadísticos completos del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerReportesEstadisticas(req, res) {
    try {
      console.log("📊 Solicitando reportes estadísticos del sistema...");
      const resultado = await SystemServices.obtenerReportesEstadisticas();

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en obtenerReportesEstadisticas controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al obtener reportes estadísticos",
        error: error.message,
      });
    }
  }

  /**
   * @name obtenerMetricasSistema
   * @description Obtener métricas generales del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerMetricasSistema(req, res) {
    try {
      console.log("⚡ Solicitando métricas del sistema...");
      const resultado = await SystemServices.obtenerMetricasSistema();

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en obtenerMetricasSistema controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al obtener métricas del sistema",
        error: error.message,
      });
    }
  }

  /**
   * @name obtenerMetricasAcademicas
   * @description Obtener métricas académicas
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerMetricasAcademicas(req, res) {
    try {
      console.log("📚 Solicitando métricas académicas...");
      const resultado = await SystemServices.obtenerMetricasAcademicas();

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en obtenerMetricasAcademicas controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al obtener métricas académicas",
        error: error.message,
      });
    }
  }

  /**
   * @name obtenerMapaCalorHorarios
   * @description Obtener mapa de calor de ocupación de horarios
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerMapaCalorHorarios(req, res) {
    try {
      console.log("🔥 Solicitando mapa de calor de horarios...");
      const resultado = await SystemServices.obtenerMapaCalorHorarios();

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en obtenerMapaCalorHorarios controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al obtener mapa de calor de horarios",
        error: error.message,
      });
    }
  }

  /**
   * @name obtenerEstadoSistema
   * @description Obtener estado general del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerEstadoSistema(req, res) {
    try {
      console.log("🔄 Solicitando estado del sistema...");
      const resultado = await SystemServices.obtenerEstadoSistema();

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en obtenerEstadoSistema controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al obtener estado del sistema",
        error: error.message,
      });
    }
  }

  /**
   * @name obtenerInformacionSistema
   * @description Obtener información general del sistema (alias de obtenerEstadoSistema)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerInformacionSistema(req, res) {
    try {
      console.log("ℹ️  Solicitando información del sistema...");
      const resultado = await SystemServices.obtenerEstadoSistema();

      return FormatterResponseController.respuestaServicio(res, {
        success: resultado.success,
        message: resultado.message,
        data: resultado.data,
        timestamp: resultado.timestamp
      });
    } catch (error) {
      console.error("❌ Error en obtenerInformacionSistema controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al obtener información del sistema",
        error: error.message,
      });
    }
  }

  // ❌ MÉTODOS ELIMINADOS (ya no existen en el servicio):
  // - obtenerEstadisticasRapidas()
  // - obtenerMetricasRendimiento() 
  // - obtenerLogsSistema() (con consulta personalizada)

  /**
   * @name obtenerLogsSistema
   * @description Obtener logs del sistema (versión simplificada)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {void}
   */
  static async obtenerLogsSistema(req, res) {
    try {
      console.log("📝 Solicitando logs del sistema...");
      
      // Usar las métricas del sistema que ya incluyen información de logs
      const resultado = await SystemServices.obtenerMetricasSistema();

      if (!resultado.success) {
        return FormatterResponseController.respuestaServicio(res, {
          success: false,
          message: "No se pudieron obtener los logs del sistema",
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // Extraer información de logs de las métricas del sistema
      const logsInfo = resultado.data?.cambiosSistema || {};

      return FormatterResponseController.respuestaServicio(res, {
        success: true,
        message: "Información de logs obtenida exitosamente",
        data: {
          eventos: logsInfo.eventos || [],
          totalEventos: logsInfo.totalEventos || 0,
          totalTiposEventos: logsInfo.totalTiposEventos || 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Error en obtenerLogsSistema controller:", error);
      return FormatterResponseController.respuestaError(res, {
        status: 500,
        title: "Error del Controlador",
        message: "Error al obtener logs del sistema",
        error: error.message,
      });
    }
  }
}