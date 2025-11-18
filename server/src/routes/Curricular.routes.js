import { Router } from "express";
import CurricularController from "../controllers/curricular.controller.js";
import { middlewareAuth } from "../middlewares/auth.js";

const {
  regitrarPNF,
  regitrarUnidadCurricular,
  mostrarPNF,
  actualizarPNF,
  actualizarDescripcionTrayecto,
  actualizarUnidadCurricular,
  eliminarUnidadCurricular,
  mostrarTrayectos,
  mostrarSecciones,
  mostrarUnidadesCurriculares,
  mostrarSeccionesByPnfAndValueTrayecto,
  mostrarSeccionesByPnfAndValueUnidadCurricular,
  CrearSecciones,
  asignacionTurnoSeccion,
} = CurricularController;

/**
 * @module CurricularRouter
 * @description Router de Express para manejar las rutas relacionadas con:
 * - Programas Nacionales de Formación (PNF)
 * - Trayectos académicos
 * - Unidades curriculares
 * - Secciones
 *
 * Todas las rutas requieren autenticación mediante middlewareAuth y roles específicos.
 */
export const CurricularRouter = Router();

/**
 * =============================================
 * RUTAS DE PROGRAMAS NACIONALES DE FORMACIÓN (PNF)
 * =============================================
 */

/**
 * @name GET /pnf
 * @description Obtiene todos los Programas Nacionales de Formación (PNF) registrados
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 *  - Coordinador
 *  - Profesor
 * @returns {Array} Lista de PNFs con sus datos completos
 */
CurricularRouter.get(
  "/pnf",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarPNF
);

/**
 * @name POST /pnf
 * @description Registra un nuevo Programa Nacional de Formación (PNF)
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 * @body {Object} datos - Datos del PNF a registrar
 * @body {string} datos.nombre_pnf - Nombre del PNF (requerido)
 * @body {string} datos.descripcion - Descripción del PNF
 * @body {string} datos.poblacionPNF - Población objetivo
 * @body {string} datos.codigoPNF - Código único del PNF (requerido)
 * @returns {Object} Objeto con mensaje de confirmación
 */
CurricularRouter.post(
  "/pnf",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  regitrarPNF
);

/**
 * @name PUT /pnf/:idPNF
 * @description Actualiza un Programa Nacional de Formación (PNF) existente
 * @param {number} idPNF - ID del PNF a actualizar
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 * @body {Object} datos - Datos actualizados del PNF (parcial o completo)
 * @body {string} [datos.nombrePNF] - Nuevo nombre del PNF
 * @body {string} [datos.descripcionPNF] - Nueva descripción
 * @body {string} [datos.codigoPNF] - Nuevo código del PNF
 * @body {number} [datos.duracionTrayectosPNF] - Nueva duración en trayectos
 * @body {number} [datos.poblacionEstudiantilPNF] - Nueva población estudiantil
 * @body {number} [datos.sedePNF] - Nueva sede del PNF
 * @body {boolean} [datos.activo] - Nuevo estado activo/inactivo
 * @returns {Object} Objeto con mensaje de confirmación y datos actualizados
 * @example
 * PUT /pnf/1
 * {
 *   "nombrePNF": "Ingeniería de Software Actualizado",
 *   "descripcionPNF": "Descripción actualizada del programa",
 *   "duracionTrayectosPNF": 5
 * }
 */
CurricularRouter.put(
  "/pnf/:idPNF",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  actualizarPNF // ← Nueva ruta para actualizar PNF
);

/**
 * =============================================
 * RUTAS DE TRAYECTOS
 * =============================================
 */

/**
 * @name GET /pnf/:codigoPNF/trayectos
 * @description Obtiene todos los trayectos académicos de un PNF específico
 * @param {string} codigoPNF - Código del PNF
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 *  - Coordinador
 *  - Profesor
 * @returns {Array} Lista de trayectos académicos
 * @example GET /pnf/INF_101/trayectos
 */
CurricularRouter.get(
  "/pnf/:codigoPNF/trayectos",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarTrayectos
);

/**
 * @name PUT /trayectos/:idTrayecto/descripcion
 * @description Actualiza la descripción de un trayecto específico
 * @param {number} idTrayecto - ID del trayecto a actualizar
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 *  - Coordinador
 * @body {Object} datos - Datos para la actualización
 * @body {string} datos.descripcionTrayecto - Nueva descripción del trayecto (requerido, min 10 caracteres, max 500)
 * @returns {Object} Objeto con mensaje de confirmación y datos actualizados
 * @example
 * PUT /trayectos/1/descripcion
 * {
 *   "descripcionTrayecto": "Nueva descripción actualizada del trayecto con enfoque en desarrollo web moderno..."
 * }
 */
CurricularRouter.put(
  "/trayectos/:idTrayecto/descripcion",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  actualizarDescripcionTrayecto
);

/**
 * =============================================
 * RUTAS DE UNIDADES CURRICULARES
 * =============================================
 */

/**
 * @name GET /trayectos/:idTrayecto/unidades-curriculares
 * @description Obtiene las unidades curriculares de un trayecto académico específico
 * @param {number} idTrayecto - ID del trayecto a consultar
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 *  - Coordinador
 *  - Profesor
 * @returns {Array} Lista de unidades curriculares
 */
CurricularRouter.get(
  "/trayectos/:idTrayecto/unidades-curriculares",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarUnidadesCurriculares
);

/**
 * @route GET /secciones/:codigoPNF/:valorTrayecto
 * @group Curricular - Operaciones relacionadas con el currículo académico
 * @param {string} codigoPNF.path.required - Código único del Programa Nacional de Formación (PNF)
 * @param {string} valorTrayecto.path.required - Valor numérico que identifica el trayecto académico
 * @returns {Object} 200 - Retorna las secciones encontradas para el PNF y trayecto especificados
 * @returns {Object} 400 - Error cuando faltan parámetros requeridos
 * @returns {Object} 404 - No se encontraron secciones para los criterios especificados
 * @returns {Object} 500 - Error interno del servidor
 * @description Obtiene todas las secciones académicas filtradas por PNF y trayecto específico
 * @example GET /api/secciones/INFORMATICA/2
 * @example Response
 * {
 *   "success": true,
 *   "message": "Secciones obtenidas exitosamente",
 *   "data": {
 *     "secciones": [
 *       {
 *         "id_seccion": 1,
 *         "valor_seccion": "A",
 *         "cupos_disponibles": 30,
 *         "nombre_turno": "MAÑANA",
 *         "id_trayecto": 5
 *       }
 *     ],
 *     "total": 1,
 *     "codigoPNF": "INFORMATICA",
 *     "valorTrayecto": "2"
 *   }
 * }
 */
CurricularRouter.get(
  "/unidades-curriculares/:codigoPNF/:valorTrayecto",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarSeccionesByPnfAndValueUnidadCurricular
);

/**
 * @name POST /trayectos/:idTrayecto/unidades-curriculares
 * @description Registra una nueva Unidad Curricular en un trayecto
 * @param {number} idTrayecto - ID del trayecto
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 * @body {Object} datos - Datos de la unidad curricular
 * @body {string} datos.nombre_unidad - Nombre de la unidad (requerido)
 * @body {string} datos.descripcion_unidad - Descripción de la unidad
 * @body {number} datos.carga_horas_unidad - Carga horaria en horas (requerido)
 * @body {string} datos.codigo_unidad - Código único de la unidad (requerido)
 * @returns {Object} Objeto con mensaje de confirmación
 */
CurricularRouter.post(
  "/trayectos/:idTrayecto/unidades-curriculares",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  regitrarUnidadCurricular
);

/**
 * @name PUT /unidades-curriculares/:idUnidadCurricular
 * @description Actualiza una Unidad Curricular existente (parcial o completamente)
 * @param {number} idUnidadCurricular - ID de la unidad curricular a actualizar
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 * @body {Object} datos - Datos actualizados de la unidad curricular
 * @body {string} [datos.codigo_unidad] - Nuevo código de la unidad
 * @body {string} [datos.nombre_unidad_curricular] - Nuevo nombre de la unidad
 * @body {string} [datos.descripcion_unidad_curricular] - Nueva descripción
 * @body {number} [datos.horas_clase] - Nuevas horas de clase
 * @body {number} [datos.id_trayecto] - Nuevo ID del trayecto
 * @returns {Object} Objeto con mensaje de confirmación y datos actualizados
 * @example
 * PUT /unidades-curriculares/1
 * {
 *   "codigo_unidad": "UC_2024_001",
 *   "nombre_unidad_curricular": "Programación Avanzada Actualizada",
 *   "descripcion_unidad_curricular": "Descripción actualizada de la unidad...",
 *   "horas_clase": 80
 * }
 */
CurricularRouter.put(
  "/unidades-curriculares/:id_unidad_curricular",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  actualizarUnidadCurricular
);

/**
 * @name DELETE /unidades-curriculares/:id_unidad_curricular
 * @description Actualiza una Unidad Curricular existente (parcial o completamente)
 * @param {number} idUnidadCurricular - ID de la unidad curricular a actualizar
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 * @body {Object} datos - Datos actualizados de la unidad curricular
 * @body {string} [datos.codigo_unidad] - Nuevo código de la unidad
 * @body {string} [datos.nombre_unidad_curricular] - Nuevo nombre de la unidad
 * @body {string} [datos.descripcion_unidad_curricular] - Nueva descripción
 * @body {number} [datos.horas_clase] - Nuevas horas de clase
 * @body {number} [datos.id_trayecto] - Nuevo ID del trayecto
 * @returns {Object} Objeto con mensaje de confirmación y datos actualizados
 * @example
 * DELETE /unidades-curriculares/1
 */
CurricularRouter.delete(
  "/unidades-curriculares/:id_unidad_curricular",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  eliminarUnidadCurricular
);

/**
 * =============================================
 * RUTAS DE SECCIONES
 * =============================================
 */

/**
 * @name GET /trayectos/:idTrayecto/secciones
 * @description Obtiene las secciones de un trayecto académico específico
 * @param {number} idTrayecto - ID del trayecto a consultar
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 *  - Coordinador
 *  - Profesor
 * @returns {Array} Lista de secciones del trayecto
 */
CurricularRouter.get(
  "/trayectos/:idTrayecto/secciones",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarSecciones
);

/**
 * @route GET /secciones/:codigoPNF/:valorTrayecto
 * @group Curricular - Operaciones relacionadas con el currículo académico
 * @param {string} codigoPNF.path.required - Código único del Programa Nacional de Formación (PNF)
 * @param {string} valorTrayecto.path.required - Valor numérico que identifica el trayecto académico
 * @returns {Object} 200 - Retorna las secciones encontradas para el PNF y trayecto especificados
 * @returns {Object} 400 - Error cuando faltan parámetros requeridos
 * @returns {Object} 404 - No se encontraron secciones para los criterios especificados
 * @returns {Object} 500 - Error interno del servidor
 * @description Obtiene todas las secciones académicas filtradas por PNF y trayecto específico
 * @example GET /api/secciones/INFORMATICA/2
 * @example Response
 * {
 *   "success": true,
 *   "message": "Secciones obtenidas exitosamente",
 *   "data": {
 *     "secciones": [
 *       {
 *         "id_seccion": 1,
 *         "valor_seccion": "A",
 *         "cupos_disponibles": 30,
 *         "nombre_turno": "MAÑANA",
 *         "id_trayecto": 5
 *       }
 *     ],
 *     "total": 1,
 *     "codigoPNF": "INFORMATICA",
 *     "valorTrayecto": "2"
 *   }
 * }
 */
CurricularRouter.get(
  "/secciones/:codigoPNF/:valorTrayecto",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarSeccionesByPnfAndValueTrayecto
);

/**
 * @name POST /trayectos/:idTrayecto/secciones
 * @description Crea nuevas secciones para un trayecto académico
 * @param {number} idTrayecto - ID del trayecto
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 * @body {Object} datos - Datos para crear las secciones
 * @body {number} datos.cantidadSecciones - Cantidad de secciones a crear
 * @body {string} datos.prefijo - Prefijo para el nombre de las secciones
 * @body {number} datos.capacidadMaxima - Capacidad máxima por sección
 * @returns {Object} Objeto con mensaje de confirmación
 */
CurricularRouter.post(
  "/trayectos/:idTrayecto/secciones",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  CrearSecciones
);

/**
 * @name PUT /secciones/:idSeccion/turno
 * @description Asigna un turno a una sección específica
 * @param {number} idSeccion - ID de la sección
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 * @body {Object} datos - Datos para la asignación de turno
 * @body {number} datos.idTurno - ID del turno a asignar (requerido)
 * @returns {Object} Objeto con mensaje de confirmación
 */
CurricularRouter.put(
  "/secciones/:idSeccion/turno",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  asignacionTurnoSeccion
);

/**
 * =============================================
 * RUTAS ADICIONALES (COMPATIBILIDAD)
 * =============================================
 */

/**
 * @name GET /secciones
 * @description Obtiene secciones con filtros (mantenimiento de compatibilidad)
 * @query {number} [trayecto] - ID del trayecto para filtrar secciones
 * @middleware Requiere autenticación y uno de estos roles:
 *  - SuperAdmin
 *  - Vicerrector
 *  - Director General de Gestión Curricular
 *  - Coordinador
 *  - Profesor
 * @returns {Array} Lista de secciones filtradas
 */
CurricularRouter.get(
  "/secciones",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarSecciones
);
