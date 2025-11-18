import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import SystemController from "../controllers/system.controller.js";

// Destructuración de los métodos del controlador de System
const {
    crearRespaldo,
    listarRespaldos,
    restaurarRespaldo,
    limpiarRespaldosAntiguos,
    descargarRespaldo,
    eliminarRespaldo,
    obtenerReportesEstadisticas,
    obtenerMetricasSistema,
    obtenerMetricasAcademicas,
    obtenerMapaCalorHorarios,
    obtenerEstadoSistema,
    obtenerInformacionSistema,
    obtenerLogsSistema
} = SystemController;

// Creación del router para las rutas del Sistema
export const SystemRouter = Router();

/**
 * =============================================
 * RUTAS DE BACKUP Y RESTAURACIÓN DEL SISTEMA
 * =============================================
 */

/**
 * @name POST /system/backup
 * @description Crear un respaldo completo de la base de datos
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Resultado de la operación de backup
 * @example
 * curl -X POST 'system/backup'
 */
SystemRouter.post(
    "/system/backup",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
    ]),
    crearRespaldo
);

/**
 * @name GET /system/backups
 * @description Listar todos los respaldos disponibles
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Array} Lista de respaldos con sus metadatos
 * @example
 * curl -X GET 'system/backups'
 */
SystemRouter.get(
    "/system/backups",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    listarRespaldos
);

/**
 * @name POST /system/restore
 * @description Restaurar la base de datos desde un respaldo
 * @body {Object} datosRestauracion - Datos para la restauración
 * @body {string} datosRestauracion.backupFileName - Nombre del archivo de backup a restaurar
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 * @returns {Object} Resultado de la operación de restauración
 * @example
 * curl -X POST 'system/restore' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "backupFileName": "sistema_universitario_backup_2024-01-15T10-30-00Z.sql"
 *   }'
 */
SystemRouter.post(
    "/system/restore",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
    ]),
    restaurarRespaldo
);

/**
 * @name DELETE /system/backups/cleanup
 * @description Eliminar respaldos antiguos del sistema
 * @query {number} [dias=30] - Número de días a mantener (default: 30)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Resultado de la operación de limpieza
 * @example
 * curl -X DELETE 'system/backups/cleanup?dias=30'
 */
SystemRouter.delete(
    "/system/backups/cleanup",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
    ]),
    limpiarRespaldosAntiguos
);

/**
 * @name DELETE /system/backups/:backupFileName
 * @description Eliminar un respaldo específico del sistema
 * @param {string} backupFileName - Nombre del archivo de backup a eliminar
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Resultado de la operación de eliminación
 * @example
 * curl -X DELETE 'system/backups/sistema_universitario_backup_2024-01-15T10-30-00Z.sql'
 */
SystemRouter.delete(
    "/system/backups/:backupFileName",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
    ]),
    eliminarRespaldo
);

/**
 * @name GET /system/backups/download/:backupFileName
 * @description Descargar un archivo de respaldo específico
 * @param {string} backupFileName - Nombre del archivo de backup a descargar
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {File} Archivo SQL de respaldo para descarga
 * @example
 * curl -X GET 'system/backups/download/sistema_universitario_backup_2024-01-15T10-30-00Z.sql' \
 *   --output backup.sql
 */
SystemRouter.get(
    "/system/backups/download/:backupFileName",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    descargarRespaldo
);

/**
 * =============================================
 * RUTAS DE REPORTES Y ESTADÍSTICAS ACTUALIZADAS
 * =============================================
 */

/**
 * @name GET /system/reportes/estadisticas
 * @description Obtener reportes estadísticos completos del sistema
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Reportes estadísticos completos
 * @example
 * curl -X GET 'system/reportes/estadisticas'
 */
SystemRouter.get(
    "/system/reportes/estadisticas",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    obtenerReportesEstadisticas
);

/**
 * @name GET /system/metricas/sistema
 * @description Obtener métricas generales del sistema
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Object} Métricas generales del sistema
 * @example
 * curl -X GET 'system/metricas/sistema'
 */
SystemRouter.get(
    "/system/metricas/sistema",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
        "Profesor",
    ]),
    obtenerMetricasSistema
);

/**
 * @name GET /system/metricas/academicas
 * @description Obtener métricas académicas
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Object} Métricas académicas del sistema
 * @example
 * curl -X GET 'system/metricas/academicas'
 */
SystemRouter.get(
    "/system/metricas/academicas",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
        "Profesor",
    ]),
    obtenerMetricasAcademicas
);

/**
 * @name GET /system/mapa-calor/horarios
 * @description Obtener mapa de calor de ocupación de horarios
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Mapa de calor de horarios
 * @example
 * curl -X GET 'system/mapa-calor/horarios'
 */
SystemRouter.get(
    "/system/mapa-calor/horarios",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    obtenerMapaCalorHorarios
);

/**
 * @name GET /system/estado
 * @description Obtener estado general del sistema
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Estado general del sistema
 * @example
 * curl -X GET 'system/estado'
 */
SystemRouter.get(
    "/system/estado",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    obtenerEstadoSistema
);

/**
 * @name GET /system/info
 * @description Obtener información general del sistema
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Object} Información general del sistema
 * @example
 * curl -X GET 'system/info'
 */
SystemRouter.get(
    "/system/info",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
        "Profesor",
    ]),
    obtenerInformacionSistema
);

/**
 * @name GET /system/logs
 * @description Obtener logs del sistema
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Logs del sistema
 * @example
 * curl -X GET 'system/logs'
 */
SystemRouter.get(
    "/system/logs",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
    ]),
    obtenerLogsSistema
);

/**
 * =============================================
 * RUTAS DE COMPATIBILIDAD Y ALIAS
 * =============================================
 */

/**
 * @name POST /system/backup/manual
 * @description Crear respaldo manual con nombre personalizado
 * @body {Object} datosBackup - Datos para el respaldo manual
 * @body {string} [datosBackup.nombre] - Nombre personalizado para el backup
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 * @returns {Object} Resultado del respaldo manual
 * @example
 * curl -X POST 'system/backup/manual' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "nombre": "backup_pre_mantenimiento"
 *   }'
 */
SystemRouter.post(
    "/system/backup/manual",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
    ]),
    crearRespaldo
);

/**
 * @name GET /api/system/backups
 * @description Obtiene listado de respaldos en formato API (compatibilidad)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Array} Lista de respaldos en formato API
 * @example
 * curl -X GET 'api/system/backups'
 */
SystemRouter.get(
    "/api/system/backups",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    listarRespaldos
);

/**
 * @name GET /api/system/estadisticas
 * @description Obtiene estadísticas en formato API (compatibilidad) - Redirige a métricas del sistema
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Estadísticas en formato API
 * @example
 * curl -X GET 'api/system/estadisticas'
 */
SystemRouter.get(
    "/api/system/estadisticas",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    obtenerMetricasSistema
);

/**
 * @name GET /api/system/status
 * @description Obtiene estado del sistema en formato API (compatibilidad)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Estado del sistema en formato API
 * @example
 * curl -X GET 'api/system/status'
 */
SystemRouter.get(
    "/api/system/status",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    obtenerEstadoSistema
);

/**
 * @name GET /api/system/metricas
 * @description Obtiene métricas del sistema en formato API (compatibilidad)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Métricas del sistema en formato API
 * @example
 * curl -X GET 'api/system/metricas'
 */
SystemRouter.get(
    "/api/system/metricas",
    middlewareAuth([
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
    ]),
    obtenerMetricasSistema
);