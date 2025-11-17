import { loadEnv } from "../utils/utilis.js";
import fs from 'fs-extra';
import { execFile } from 'child_process';
import path from 'path';
import SystemModel from '../models/system.model.js';

loadEnv();

class SystemServices {
    constructor() {
        this.system = process.env.SYSTEM_NAME || 'sistema_universitario';
    }

    static async crearRespaldo() {
        console.log("🔧 Creando respaldo del sistema...");

        try {
            const backupsDir = path.join(process.cwd(), 'src', 'database', 'backups');
            await fs.ensureDir(backupsDir);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const systemName = process.env.SYSTEM_NAME || 'sistema_universitario';
            const backupFileName = `${systemName}_backup_${timestamp}.sql`;
            const backupPath = path.join(backupsDir, backupFileName);

            console.log(`📁 Ruta de backup: ${backupPath}`);

            // ✅ SOLUCIÓN PARA WINDOWS: usar execFile con variables de entorno
            const args = [
                '-U', process.env.DB_USER,
                '-h', process.env.DB_HOST,
                '-p', process.env.DB_PORT,
                '-d', process.env.DB_NAME,
                '-F', 'c',
                '-b',
                '-v',
                '-f', backupPath
            ];

            // Configurar entorno con la contraseña
            const env = {
                ...process.env,
                PGPASSWORD: process.env.DB_PASSWORD
            };

            await new Promise((resolve, reject) => {
                execFile('pg_dump', args, { env }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Error al crear respaldo: ${error.message}`);
                        reject(error);
                        return;
                    }

                    if (stderr && !stderr.includes('WARNING')) {
                        console.log(`⚠️  Advertencias: ${stderr}`);
                    }

                    console.log(`✅ Respaldo creado exitosamente: ${backupPath}`);
                    resolve(stdout);
                });
            });

            const stats = await fs.stat(backupPath);
            console.log(`📊 Tamaño del backup: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

            return {
                success: true,
                message: 'Respaldo creado exitosamente',
                path: backupPath,
                size: stats.size,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error("❌ Error al crear respaldo:", error);
            return {
                success: false,
                message: `Error al crear respaldo: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Método adicional para listar backups existentes
    static async listarRespaldos() {
        try {
            const backupsDir = path.join(process.cwd(), 'src', 'database', 'backups');

            // Verificar si el directorio existe
            if (!await fs.pathExists(backupsDir)) {
                return [];
            }

            const files = await fs.readdir(backupsDir);
            const backups = [];

            for (const file of files) {
                if (file.endsWith('.sql')) {
                    const filePath = path.join(backupsDir, file);
                    const stats = await fs.stat(filePath);

                    backups.push({
                        nombre: file,
                        ruta: filePath,
                        tamaño: stats.size,
                        fechaModificacion: stats.mtime,
                        fechaCreacion: stats.birthtime || stats.ctime
                    });
                }
            }

            // Ordenar por fecha de modificación (más reciente primero)
            backups.sort((a, b) => new Date(b.fechaModificacion) - new Date(a.fechaModificacion));

            return backups;

        } catch (error) {
            console.error("Error al listar respaldos:", error);
            return [];
        }
    }

    // Método para eliminar backups antiguos
    static async limpiarRespaldosAntiguos(dias = 30) {
        try {
            const backups = await this.listarRespaldos();
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - dias);

            const backupsAEliminar = backups.filter(backup =>
                new Date(backup.fechaCreacion) < fechaLimite
            );

            for (const backup of backupsAEliminar) {
                await fs.remove(backup.ruta);
                console.log(`🗑️  Backup eliminado: ${backup.nombre}`);
            }

            return {
                eliminados: backupsAEliminar.length,
                total: backups.length
            };

        } catch (error) {
            console.error("Error al limpiar respaldos antiguos:", error);
            return { eliminados: 0, total: 0, error: error.message };
        }
    }

    // Método para restaurar desde backup
    static async restaurarRespaldo(backupFileName) {
        try {
            const backupsDir = path.join(process.cwd(), 'src', 'database', 'backups');
            const backupPath = path.join(backupsDir, backupFileName);

            // Verificar que el archivo existe
            if (!await fs.pathExists(backupPath)) {
                throw new Error(`El archivo de backup ${backupFileName} no existe`);
            }

            console.log(`🔄 Restaurando desde: ${backupPath}`);

            // ✅ SOLUCIÓN PARA WINDOWS: Usar execFile con variables de entorno
            const args = [
                '-U', process.env.DB_USER,
                '-h', process.env.DB_HOST,
                '-p', process.env.DB_PORT,
                '-d', process.env.DB_NAME,
                '-c', // Clean (drop) database objects before recreating
                '-v', // Verbose
                backupPath
            ];

            // Configurar entorno con la contraseña
            const env = {
                ...process.env,
                PGPASSWORD: process.env.DB_PASSWORD
            };

            await new Promise((resolve, reject) => {
                execFile('pg_restore', args, { env }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Error al restaurar: ${error.message}`);
                        console.error(`🔍 Comando: pg_restore ${args.join(' ')}`);
                        reject(error);
                        return;
                    }

                    if (stderr && !stderr.includes('WARNING')) {
                        console.log(`⚠️  Advertencias durante restauración: ${stderr}`);
                    }

                    if (stdout) {
                        console.log(`📋 Salida de pg_restore: ${stdout}`);
                    }

                    console.log(`✅ Restauración completada exitosamente`);
                    resolve(stdout);
                });
            });

            return {
                success: true,
                message: 'Base de datos restaurada exitosamente',
                backup: backupFileName,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error("❌ Error al restaurar respaldo:", error);
            return {
                success: false,
                message: `Error al restaurar: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Método para eliminar backup específico
    static async eliminarRespaldo(backupFileName) {
        try {
            const backupsDir = path.join(process.cwd(), 'src', 'database', 'backups');
            const backupPath = path.join(backupsDir, backupFileName);

            // Verificar que el archivo existe
            if (!await fs.pathExists(backupPath)) {
                throw new Error(`El archivo de backup ${backupFileName} no existe`);
            }

            console.log(`🧹 Eliminando respaldo: ${backupPath}`);
            await fs.remove(backupPath);
            console.log(`✅ Respaldo eliminado exitosamente`);
            return {
                success: true,
                message: 'Respaldo eliminado exitosamente',
                backup: backupFileName,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error("❌ Error al eliminar respaldo:", error);
            return {
                success: false,
                message: `Error al eliminar respaldo: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 📊 MÉTODOS DE REPORTES Y ESTADÍSTICAS

    /**
     * @name obtenerReportesEstadisticas
     * @description Obtiene reportes estadísticos completos del sistema
     * @returns {Object} Reportes estadísticos
     */
    static async obtenerReportesEstadisticas() {
        try {
            console.log("📊 Generando reportes estadísticos del sistema...");
            const resultado = await SystemModel.reportesEstadisticas();

            if (resultado.success) {
                console.log("✅ Reportes estadísticos generados exitosamente");
                return resultado;
            } else {
                throw new Error(resultado.message || "Error al generar reportes estadísticos");
            }
        } catch (error) {
            console.error("❌ Error en obtenerReportesEstadisticas:", error);
            return {
                success: false,
                message: `Error al obtener reportes estadísticos: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * @name obtenerEstadisticasRapidas
     * @description Obtiene estadísticas rápidas del sistema
     * @returns {Object} Estadísticas rápidas
     */
    static async obtenerEstadisticasRapidas() {
        try {
            console.log("⚡ Obteniendo estadísticas rápidas del sistema...");
            const resultado = await SystemModel.obtenerEstadisticasRapidas();

            if (resultado.success) {
                console.log("✅ Estadísticas rápidas obtenidas exitosamente");
                return resultado;
            } else {
                throw new Error(resultado.message || "Error al obtener estadísticas rápidas");
            }
        } catch (error) {
            console.error("❌ Error en obtenerEstadisticasRapidas:", error);
            return {
                success: false,
                message: `Error al obtener estadísticas rápidas: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * @name obtenerMetricasRendimiento
     * @description Obtiene métricas de rendimiento del sistema
     * @returns {Object} Métricas de rendimiento
     */
    static async obtenerMetricasRendimiento() {
        try {
            console.log("📈 Obteniendo métricas de rendimiento del sistema...");
            const resultado = await SystemModel.obtenerMetricasRendimiento();

            if (resultado.success) {
                console.log("✅ Métricas de rendimiento obtenidas exitosamente");
                return resultado;
            } else {
                throw new Error(resultado.message || "Error al obtener métricas de rendimiento");
            }
        } catch (error) {
            console.error("❌ Error en obtenerMetricasRendimiento:", error);
            return {
                success: false,
                message: `Error al obtener métricas de rendimiento: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * @name obtenerMapaCalorHorarios
     * @description Obtiene el mapa de calor de ocupación de horarios
     * @returns {Object} Datos del mapa de calor
     */
    static async obtenerMapaCalorHorarios() {
        try {
            console.log("🔥 Generando mapa de calor de horarios...");

            // Usar la vista del mapa de calor si existe, o calcular en tiempo real
            const query = `
                SELECT * FROM vista_mapa_calor_academico 
                ORDER BY 
                    CASE dia
                        WHEN 'Lunes' THEN 1
                        WHEN 'Martes' THEN 2
                        WHEN 'Miercoles' THEN 3
                        WHEN 'Jueves' THEN 4
                        WHEN 'Viernes' THEN 5
                        WHEN 'Sabado' THEN 6
                    END,
                    bloque
            `;

            const resultado = await SystemModel.reportesEstadisticas();
            return {
                message: 'Mapa de calor generado exitosamente',
                data: resultado,
            };
        } catch (error) {
            console.error("❌ Error en obtenerMapaCalorHorarios:", error);
            return {
                success: false,
                message: `Error al obtener mapa de calor: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * @name obtenerEstadoSistema
     * @description Obtiene el estado general del sistema
     * @returns {Object} Estado del sistema
     */
    static async obtenerEstadoSistema() {
        try {
            console.log("🔄 Obteniendo estado del sistema...");

            // Combinar estadísticas rápidas y métricas de rendimiento
            const [estadisticasRapidas, metricasRendimiento] = await Promise.all([
                this.obtenerEstadisticasRapidas(),
                this.obtenerMetricasRendimiento()
            ]);

            if (estadisticasRapidas.success && metricasRendimiento.success) {
                const estadoSistema = {
                    estadisticas: estadisticasRapidas.data,
                    metricas: metricasRendimiento.data,
                    backups: await this.listarRespaldos(),
                    sistema: {
                        nombre: process.env.SYSTEM_NAME || 'sistema_universitario',
                        baseDatos: process.env.DB_NAME,
                        entorno: process.env.NODE_ENV || 'development',
                        timestamp: new Date().toISOString()
                    }
                };

                console.log("✅ Estado del sistema obtenido exitosamente");
                return {
                    success: true,
                    message: 'Estado del sistema obtenido exitosamente',
                    data: estadoSistema,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error("Error al obtener componentes del estado del sistema");
            }
        } catch (error) {
            console.error("❌ Error en obtenerEstadoSistema:", error);
            return {
                success: false,
                message: `Error al obtener estado del sistema: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * @name ejecutarConsultaPersonalizada
     * @description Ejecuta una consulta SQL personalizada (para uso interno)
     * @param {string} query - Consulta SQL a ejecutar
     * @returns {Object} Resultado de la consulta
     */
    static async ejecutarConsultaPersonalizada(query) {
        try {
            console.log("🔍 Ejecutando consulta personalizada...");
            const resultado = await SystemModel.ejecutarConsultaPersonalizada(query);

            return resultado;
        } catch (error) {
            console.error("❌ Error en ejecutarConsultaPersonalizada:", error);
            return {
                success: false,
                message: `Error al ejecutar consulta personalizada: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default SystemServices;