import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import CoordinadorController from "../controllers/coordinador.controller.js";

// Destructuración de los métodos del controlador de Coordinador
const {
  asignarCoordinador,
  listarCoordinadores,
  listarCoordinadoresDestituidos,
  actualizarCoordinador,
  eliminarCoordinador,
  obtenerHistorialDestituciones,
  restituirCoordinador,
  reasignarCoordinador
} = CoordinadorController;

// Creación del router para las rutas de Coordinador
export const coordinadorRouter = Router();

/**
 * =============================================
 * RUTAS DE COORDINADORES (CRUD PRINCIPAL)
 * =============================================
 */

/**
 * @name GET /coordinadores
 * @description Obtiene listado de todos los coordinadores existentes
 * @query {string} [estatus] - Filtro por estatus (activo/inactivo)
 * @query {string} [departamento] - Filtro por departamento
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Array} Lista de coordinadores
 * @example
 * // Obtener todos los coordinadores activos
 * curl -X GET 'http://localhost:3000/coordinadores?estatus=activo'
 *
 * // Obtener coordinadores de un departamento específico
 * curl -X GET 'http://localhost:3000/coordinadores?departamento=Informática'
 */
coordinadorRouter.get(
  "/coordinadores",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  listarCoordinadores
);

/**
 * @name GET /coordinadores/destituidos
 * @description Obtiene listado de todos los coordinadores destituidos
 * @query {number} [page] - Página para paginación
 * @query {number} [limit] - Límite de resultados por página
 * @query {string} [sort] - Campo para ordenar (nombres, apellidos, nombre_pnf, fecha_destitucion)
 * @query {string} [order] - Orden (ASC/DESC)
 * @query {number} [id_pnf] - Filtrar por ID de PNF
 * @query {string} [cedula] - Filtrar por cédula del coordinador
 * @query {string} [nombre_pnf] - Filtrar por nombre del PNF
 * @query {string} [tipo_accion] - Filtrar por tipo de acción (DESTITUCION, ELIMINACION)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Array} Lista de coordinadores destituidos
 * @example
 * // Obtener todos los coordinadores destituidos
 * curl -X GET 'http://localhost:3000/coordinadores/destituidos'
 *
 * // Obtener coordinadores destituidos con paginación
 * curl -X GET 'http://localhost:3000/coordinadores/destituidos?page=1&limit=10&sort=fecha_destitucion&order=DESC'
 *
 * // Filtrar por PNF específico
 * curl -X GET 'http://localhost:3000/coordinadores/destituidos?id_pnf=1'
 */
coordinadorRouter.get(
  "/coordinadores/destituidos",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  listarCoordinadoresDestituidos
);

/**
 * @name GET /coordinadores/:id
 * @description Obtiene un coordinador específico por ID
 * @param {number} id - ID del coordinador
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Datos del coordinador
 * @example
 * curl -X GET 'http://localhost:3000/coordinadores/1'
 */
coordinadorRouter.get(
  "/coordinadores/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ])
  //obtenerCoordinadorPorId
);

/**
 * @name POST /coordinadores
 * @description Asigna a un profesor existente como coordinador
 * @body {Object} Datos de asignación
 * @body {number} body.cedula_profesor - Cédula del profesor a asignar (requerido)
 * @body {string} body.departamento - Departamento de coordinación (requerido)
 * @body {string} body.area_responsabilidad - Área de responsabilidad (requerido)
 * @body {string} body.fecha_inicio - Fecha de inicio (requerido, formato YYYY-MM-DD)
 * @body {string} [body.fecha_fin] - Fecha de finalización (formato YYYY-MM-DD)
 * @body {string} [body.observaciones] - Observaciones adicionales
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Coordinador creado
 * @example
 * curl -X POST 'http://localhost:3000/coordinadores' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "cedula_profesor": 31264460,
 *     "departamento": "Informática",
 *     "area_responsabilidad": "Coordinación de Extensión",
 *     "fecha_inicio": "2024-01-15",
 *     "fecha_fin": "2025-01-15",
 *     "observaciones": "Asignación por reestructuración departamental"
 *   }'
 */
coordinadorRouter.post(
  "/coordinadores",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  asignarCoordinador
);

/**
 * @name PUT /coordinadores/:id
 * @description Actualiza los datos de un coordinador existente
 * @param {number} id - ID del coordinador a actualizar
 * @body {Object} Datos actualizados del coordinador
 * @body {string} [body.departamento] - Nuevo departamento
 * @body {string} [body.area_responsabilidad] - Nueva área de responsabilidad
 * @body {string} [body.fecha_fin] - Nueva fecha de finalización
 * @body {string} [body.estatus] - Nuevo estatus (activo/inactivo)
 * @body {string} [body.observaciones] - Nuevas observaciones
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Object} Coordinador actualizado
 * @example
 * curl -X PUT 'http://localhost:3000/coordinadores/1' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "departamento": "Nuevo Departamento",
 *     "area_responsabilidad": "Nueva Área de Responsabilidad",
 *     "fecha_fin": "2026-01-15",
 *     "estatus": "activo"
 *   }'
 */
coordinadorRouter.put(
  "/coordinadores/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  actualizarCoordinador
);
/**
 * @name PUT /coordinadores/:cedula/reasignar-pnf
 * @description Reasigna un coordinador existente a otro PNF
 * @param {number} cedula - Cédula del coordinador a reasignar
 * @body {Object} Datos de reasignación
 * @body {number} body.id_pnf_nuevo - ID del nuevo PNF
 * @body {string} [body.observaciones] - Observaciones de la reasignación
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Coordinador reasignado con datos del PNF anterior y nuevo
 * @example
 * curl -X PUT 'http://localhost:3000/coordinadores/12345678/reasignar-pnf' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "id_pnf_nuevo": 2,
 *     "observaciones": "Reasignación por reestructuración académica"
 *   }'
 */
coordinadorRouter.put(
  "/coordinadores/:cedula/reasignar-pnf",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  reasignarCoordinador
);

/**
 * @name DELETE /coordinadores/:id/destituir
 * @description Destituye un coordinador del sistema (remueve del cargo pero mantiene como profesor)
 * @param {number} id - ID del coordinador a destituir
 * @body {Object} datosDestitucion - Datos de la destitución
 * @body {string} datosDestitucion.tipo_accion - Tipo de acción (DESTITUCION, RENUNCIA)
 * @body {string} datosDestitucion.razon - Razón de la destitución
 * @body {string} [datosDestitucion.observaciones] - Observaciones adicionales
 * @body {string} [datosDestitucion.fecha_efectiva] - Fecha efectiva de la destitución
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Confirmación de destitución
 * @example
 * curl -X DELETE 'http://localhost:3000/coordinadores/1/destituir' \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "tipo_accion": "DESTITUCION",
 *     "razon": "Falta grave a las normas institucionales",
 *     "observaciones": "Incumplimiento reiterado de funciones",
 *     "fecha_efectiva": "2024-01-15"
 *   }'
 */
coordinadorRouter.delete(
  "/coordinadores/:id/destituir",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  eliminarCoordinador
);

/**
 * @name POST /coordinadores/:id/restitur
 * @description Restituye (reingresa) un coordinador previamente destituido
 * @param {number} id - ID del coordinador a restituir
 * @body {Object} datosRestitucion - Datos de la restitución
 * @body {string} datosRestitucion.tipo_reingreso - Tipo de reingreso (REINGRESO, REINCORPORACION, REINTEGRO)
 * @body {string} datosRestitucion.motivo_reingreso - Motivo del reingreso
 * @body {string} [datosRestitucion.observaciones] - Observaciones adicionales
 * @body {string} [datosRestitucion.fecha_efectiva] - Fecha efectiva del reingreso
 * @body {number} [datosRestitucion.registro_anterior_id] - ID del registro de destitución anterior
 * @body {number} [datosRestitucion.id_pnf] - ID del PNF al que se reasigna
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Confirmación de restitución
 * @example
 * curl -X POST 'http://localhost:3000/coordinadores/1/restitur' \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "tipo_reingreso": "REINGRESO",
 *     "motivo_reingreso": "Revisión favorable del caso",
 *     "observaciones": "Coordinador reincorporado tras evaluación positiva",
 *     "fecha_efectiva": "2024-02-01",
 *     "id_pnf": 5
 *   }'
 */
coordinadorRouter.post(
  "/coordinadores/:id/restitur",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  restituirCoordinador
);

/**
 * @name GET /coordinadores/:id/historial-destituciones
 * @description Obtiene el historial de destituciones de un coordinador
 * @param {number} id - ID del coordinador
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador (solo su propio historial)
 * @returns {Object} Lista de destituciones del coordinador
 * @example
 * curl -X GET 'http://localhost:3000/coordinadores/1/historial-destituciones'
 */
coordinadorRouter.get(
  "/coordinadores/:id/historial-destituciones",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  obtenerHistorialDestituciones
);
