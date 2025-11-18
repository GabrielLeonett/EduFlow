import { loadEnv } from "../utils/utilis.js";
import fs from "fs-extra";
import { execFile } from "child_process";
import path from "path";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import SystemModel from "../models/system.model.js";

loadEnv();

class SystemServices {
  constructor() {
    this.system = process.env.SYSTEM_NAME || "sistema_universitario";
  }

  /**
   * @static
   * @async
   * @method crearRespaldo
   * @description Crear respaldo de la base de datos
   * @returns {Object} Resultado de la operación
   */
  static async crearRespaldo() {
    try {
      console.log("🔧 Creando respaldo del sistema...");

      const backupsDir = path.join(process.cwd(), "src", "database", "backups");
      await fs.ensureDir(backupsDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const systemName = process.env.SYSTEM_NAME || "sistema_universitario";
      const backupFileName = `${systemName}_backup_${timestamp}.sql`;
      const backupPath = path.join(backupsDir, backupFileName);

      console.log(`📁 Ruta de backup: ${backupPath}`);

      const args = [
        "-U",
        process.env.DB_USER,
        "-h",
        process.env.DB_HOST,
        "-p",
        process.env.DB_PORT,
        "-d",
        process.env.DB_NAME,
        "-F",
        "c",
        "-b",
        "-v",
        "-f",
        backupPath,
      ];

      const env = {
        ...process.env,
        PGPASSWORD: process.env.DB_PASSWORD,
      };

      await new Promise((resolve, reject) => {
        execFile("pg_dump", args, { env }, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error al crear respaldo: ${error.message}`);
            reject(error);
            return;
          }

          if (stderr && !stderr.includes("WARNING")) {
            console.log(`⚠️  Advertencias: ${stderr}`);
          }

          console.log(`✅ Respaldo creado exitosamente: ${backupPath}`);
          resolve(stdout);
        });
      });

      const stats = await fs.stat(backupPath);
      console.log(
        `📊 Tamaño del backup: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
      );

      return FormatterResponseService.success(
        {
          path: backupPath,
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
          timestamp: new Date().toISOString(),
        },
        "Respaldo creado exitosamente",
        {
          status: 201,
          title: "Respaldo de Base de Datos",
        }
      );
    } catch (error) {
      console.error("❌ Error en crearRespaldo:", error);
      return FormatterResponseService.error(
        `Error al crear respaldo: ${error.message}`,
        {
          status: 500,
          title: "Error en Respaldo",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method listarRespaldos
   * @description Listar todos los respaldos disponibles
   * @returns {Object} Resultado de la operación
   */
  static async listarRespaldos() {
    try {
      console.log("📂 Listando respaldos disponibles...");

      const backupsDir = path.join(process.cwd(), "src", "database", "backups");

      if (!(await fs.pathExists(backupsDir))) {
        return FormatterResponseService.success(
          {
            backups: [],
            total: 0,
          },
          "No hay respaldos disponibles",
          {
            status: 200,
            title: "Lista de Respaldos",
          }
        );
      }

      const files = await fs.readdir(backupsDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith(".sql")) {
          const filePath = path.join(backupsDir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            nombre: file,
            ruta: filePath,
            tamaño: stats.size,
            tamañoMB: (stats.size / 1024 / 1024).toFixed(2),
            fechaModificacion: stats.mtime,
            fechaCreacion: stats.birthtime || stats.ctime,
          });
        }
      }

      backups.sort(
        (a, b) => new Date(b.fechaModificacion) - new Date(a.fechaModificacion)
      );

      return FormatterResponseService.success(
        {
          backups: backups,
          total: backups.length,
        },
        "Respaldos listados exitosamente",
        {
          status: 200,
          title: "Lista de Respaldos",
        }
      );
    } catch (error) {
      console.error("❌ Error en listarRespaldos:", error);
      return FormatterResponseService.error(
        `Error al listar respaldos: ${error.message}`,
        {
          status: 500,
          title: "Error en Listado de Respaldos",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method limpiarRespaldosAntiguos
   * @description Eliminar respaldos más antiguos que X días
   * @param {Object} queryParams - Parámetros de consulta (dias)
   * @returns {Object} Resultado de la operación
   */
  static async limpiarRespaldosAntiguos(queryParams = {}) {
    try {
      console.log("🧹 Limpiando respaldos antiguos...");

      const dias = parseInt(queryParams.dias) || 30;
      
      const respuestaRespaldos = await this.listarRespaldos();
      
      if (FormatterResponseService.isError(respuestaRespaldos)) {
        return respuestaRespaldos;
      }

      const backups = respuestaRespaldos.data.backups;
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);

      const backupsAEliminar = backups.filter(
        (backup) => new Date(backup.fechaCreacion) < fechaLimite
      );

      for (const backup of backupsAEliminar) {
        await fs.remove(backup.ruta);
        console.log(`🗑️  Backup eliminado: ${backup.nombre}`);
      }

      return FormatterResponseService.success(
        {
          eliminados: backupsAEliminar.length,
          total: backups.length,
          dias: dias,
          fechaLimite: fechaLimite.toISOString(),
        },
        `Respaldos antiguos limpiados exitosamente (${backupsAEliminar.length} eliminados)`,
        {
          status: 200,
          title: "Limpieza de Respaldos",
        }
      );
    } catch (error) {
      console.error("❌ Error en limpiarRespaldosAntiguos:", error);
      return FormatterResponseService.error(
        `Error al limpiar respaldos antiguos: ${error.message}`,
        {
          status: 500,
          title: "Error en Limpieza de Respaldos",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method restaurarRespaldo
   * @description Restaurar base de datos desde un respaldo
   * @param {string} backupFileName - Nombre del archivo de respaldo
   * @returns {Object} Resultado de la operación
   */
  static async restaurarRespaldo(backupFileName) {
    try {
      console.log(`🔄 Restaurando desde: ${backupFileName}`);

      const backupsDir = path.join(process.cwd(), "src", "database", "backups");
      const backupPath = path.join(backupsDir, backupFileName);

      if (!(await fs.pathExists(backupPath))) {
        return FormatterResponseService.validationError(
          [`El archivo de backup ${backupFileName} no existe`],
          "Archivo de respaldo no encontrado",
          {
            status: 404,
            title: "Respaldo No Encontrado",
          }
        );
      }

      const args = [
        "-U",
        process.env.DB_USER,
        "-h",
        process.env.DB_HOST,
        "-p",
        process.env.DB_PORT,
        "-d",
        process.env.DB_NAME,
        "-c",
        "-v",
        backupPath,
      ];

      const env = {
        ...process.env,
        PGPASSWORD: process.env.DB_PASSWORD,
      };

      await new Promise((resolve, reject) => {
        execFile("pg_restore", args, { env }, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error al restaurar: ${error.message}`);
            reject(error);
            return;
          }

          if (stderr && !stderr.includes("WARNING")) {
            console.log(`⚠️  Advertencias durante restauración: ${stderr}`);
          }

          console.log(`✅ Restauración completada exitosamente`);
          resolve(stdout);
        });
      });

      return FormatterResponseService.success(
        {
          backup: backupFileName,
          timestamp: new Date().toISOString(),
        },
        "Base de datos restaurada exitosamente",
        {
          status: 200,
          title: "Restauración Completada",
        }
      );
    } catch (error) {
      console.error("❌ Error en restaurarRespaldo:", error);
      return FormatterResponseService.error(
        `Error al restaurar respaldo: ${error.message}`,
        {
          status: 500,
          title: "Error en Restauración",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method eliminarRespaldo
   * @description Eliminar un respaldo específico
   * @param {string} backupFileName - Nombre del archivo de respaldo
   * @returns {Object} Resultado de la operación
   */
  static async eliminarRespaldo(backupFileName) {
    try {
      console.log(`🧹 Eliminando respaldo: ${backupFileName}`);

      const backupsDir = path.join(process.cwd(), "src", "database", "backups");
      const backupPath = path.join(backupsDir, backupFileName);

      if (!(await fs.pathExists(backupPath))) {
        return FormatterResponseService.validationError(
          [`El archivo de backup ${backupFileName} no existe`],
          "Archivo de respaldo no encontrado",
          {
            status: 404,
            title: "Respaldo No Encontrado",
          }
        );
      }

      await fs.remove(backupPath);
      console.log(`✅ Respaldo eliminado exitosamente`);

      return FormatterResponseService.success(
        {
          backup: backupFileName,
          timestamp: new Date().toISOString(),
        },
        "Respaldo eliminado exitosamente",
        {
          status: 200,
          title: "Respaldo Eliminado",
        }
      );
    } catch (error) {
      console.error("❌ Error en eliminarRespaldo:", error);
      return FormatterResponseService.error(
        `Error al eliminar respaldo: ${error.message}`,
        {
          status: 500,
          title: "Error en Eliminación",
        }
      );
    }
  }

  // 📊 MÉTODOS DE REPORTES Y ESTADÍSTICAS

  /**
   * @static
   * @async
   * @method obtenerReportesEstadisticas
   * @description Obtener reportes estadísticos completos del sistema
   * @returns {Object} Resultado de la operación
   */
  static async obtenerReportesEstadisticas() {
    try {
      console.log("📊 Generando reportes estadísticos del sistema...");
      
      const respuestaModel = await SystemModel.reportesEstadisticas();

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Extraer datos del modelo (que ahora viene envuelto en FormatterResponseModel)
      const datosModelo = respuestaModel.data?.[0] || respuestaModel;

      return FormatterResponseService.success(
        datosModelo,
        "Reportes estadísticos generados exitosamente",
        {
          status: 200,
          title: "Reportes Estadísticos",
        }
      );
    } catch (error) {
      console.error("❌ Error en obtenerReportesEstadisticas:", error);
      return FormatterResponseService.error(
        `Error al obtener reportes estadísticos: ${error.message}`,
        {
          status: 500,
          title: "Error en Reportes",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerMetricasSistema
   * @description Obtener métricas generales del sistema
   * @returns {Object} Resultado de la operación
   */
  static async obtenerMetricasSistema() {
    try {
      console.log("⚡ Obteniendo métricas del sistema...");
      
      const respuestaModel = await SystemModel.obtenerMetricasSistema();

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Extraer datos del modelo
      const datosModelo = respuestaModel.data?.[0] || respuestaModel;

      return FormatterResponseService.success(
        datosModelo,
        "Métricas del sistema obtenidas exitosamente",
        {
          status: 200,
          title: "Métricas del Sistema",
        }
      );
    } catch (error) {
      console.error("❌ Error en obtenerMetricasSistema:", error);
      return FormatterResponseService.error(
        `Error al obtener métricas del sistema: ${error.message}`,
        {
          status: 500,
          title: "Error en Métricas",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerMetricasAcademicas
   * @description Obtener métricas académicas
   * @returns {Object} Resultado de la operación
   */
  static async obtenerMetricasAcademicas() {
    try {
      console.log("📚 Obteniendo métricas académicas...");
      
      const respuestaModel = await SystemModel.obtenerMetricasAcademicas();

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Extraer datos del modelo
      const datosModelo = respuestaModel.data?.[0] || respuestaModel;

      return FormatterResponseService.success(
        datosModelo,
        "Métricas académicas obtenidas exitosamente",
        {
          status: 200,
          title: "Métricas Académicas",
        }
      );
    } catch (error) {
      console.error("❌ Error en obtenerMetricasAcademicas:", error);
      return FormatterResponseService.error(
        `Error al obtener métricas académicas: ${error.message}`,
        {
          status: 500,
          title: "Error en Métricas Académicas",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerMapaCalorHorarios
   * @description Obtener mapa de calor de ocupación de horarios
   * @returns {Object} Resultado de la operación
   */
  static async obtenerMapaCalorHorarios() {
    try {
      console.log("🔥 Generando mapa de calor de horarios...");
      
      const respuestaModel = await SystemModel.obtenerMapaCalorOcupacion();

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Extraer datos del modelo
      const datosModelo = respuestaModel.data?.[0] || respuestaModel;

      return FormatterResponseService.success(
        datosModelo,
        "Mapa de calor generado exitosamente",
        {
          status: 200,
          title: "Mapa de Calor",
        }
      );
    } catch (error) {
      console.error("❌ Error en obtenerMapaCalorHorarios:", error);
      return FormatterResponseService.error(
        `Error al obtener mapa de calor: ${error.message}`,
        {
          status: 500,
          title: "Error en Mapa de Calor",
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerEstadoSistema
   * @description Obtener estado general del sistema
   * @returns {Object} Resultado de la operación
   */
  static async obtenerEstadoSistema() {
    try {
      console.log("🔄 Obteniendo estado del sistema...");

      const [metricasSistema, respaldos] = await Promise.all([
        this.obtenerMetricasSistema(),
        this.listarRespaldos(),
      ]);

      if (FormatterResponseService.isError(metricasSistema)) {
        return metricasSistema;
      }

      if (FormatterResponseService.isError(respaldos)) {
        return respaldos;
      }

      // Extraer datos de métricas del sistema
      const datosMetricas = metricasSistema.data || {};

      return FormatterResponseService.success(
        {
          sistema: {
            nombre: process.env.SYSTEM_NAME || "sistema_universitario",
            baseDatos: process.env.DB_NAME,
            entorno: process.env.NODE_ENV || "development",
            timestamp: new Date().toISOString(),
          },
          metricas: datosMetricas,
          respaldos: respaldos.data,
        },
        "Estado del sistema obtenido exitosamente",
        {
          status: 200,
          title: "Estado del Sistema",
        }
      );
    } catch (error) {
      console.error("❌ Error en obtenerEstadoSistema:", error);
      return FormatterResponseService.error(
        `Error al obtener estado del sistema: ${error.message}`,
        {
          status: 500,
          title: "Error en Estado del Sistema",
        }
      );
    }
  }
}

export default SystemServices;