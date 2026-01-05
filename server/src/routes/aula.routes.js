import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import AulaController from "../controllers/aulas.controller.js";

// Destructuración de los métodos del controlador de Aula
const {
  registerAula,
  mostrarAulas,
  obtenerAulaPorId,
  actualizarAula,
  eliminarAula,
  obtenerAulasPorTipo,
  obtenerAulasPorSede,
  obtenerAulasPorPnf
} = AulaController;

// Creación del router para las rutas de Aula
export const AulaRouter = Router();

/**
 * =============================================
 * RUTAS DE AULAS (CRUD PRINCIPAL)
 * =============================================
 */

/**
 * @name GET /aulas
 * @description Obtiene el listado de todas las aulas registradas
 * @query {string} [tipo] - Filtro por tipo de aula (teorica, laboratorio, taller, etc.)
 * @query {string} [sede] - Filtro por sede o ubicación
 * @query {number} [capacidadMin] - Filtro por capacidad mínima
 * @query {number} [capacidadMax] - Filtro por capacidad máxima
 * @query {boolean} [disponible] - Filtro por disponibilidad
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Array} Lista de aulas con sus datos completos
 * @example
 * // Obtener todas las aulas
 * curl -X GET 'http://localhost:3000/aulas'
 *
 * // Obtener aulas de tipo laboratorio
 * curl -X GET 'http://localhost:3000/aulas?tipo=laboratorio'
 *
 * // Obtener aulas con capacidad mayor a 30 personas
 * curl -X GET 'http://localhost:3000/aulas?capacidadMin=30'
 */
AulaRouter.get(
  "/aulas",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarAulas
);

/**
 * @name GET /aulas/:id
 * @description Obtiene los datos de un aula específica por ID
 * @param {number} id - ID del aula
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Object} Datos completos del aula
 * @example
 * curl -X GET 'http://localhost:3000/aulas/1'
 */
AulaRouter.get(
  "/aulas/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerAulaPorId
);

/**
 * @name POST /aulas
 * @description Registra una nueva aula en el sistema
 * @body {Object} datosAula - Datos del aula a registrar
 * @body {string} datosAula.nombre_aula - Nombre o código del aula (requerido)
 * @body {string} datosAula.tipo_aula - Tipo de aula (teorica, laboratorio, taller) (requerido)
 * @body {number} datosAula.capacidad - Capacidad máxima de estudiantes (requerido)
 * @body {string} datosAula.ubicacion - Ubicación física del aula (requerido)
 * @body {string} datosAula.descripcion - Descripción adicional del aula
 * @body {string} datosAula.equipamiento - Equipamiento disponible
 * @body {boolean} datosAula.disponible - Estado de disponibilidad (default: true)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Aula creada con ID asignado
 * @example
 * curl -X POST 'http://localhost:3000/aulas' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "nombre_aula": "LAB-101",
 *     "tipo_aula": "laboratorio",
 *     "capacidad": 40,
 *     "ubicacion": "Edificio A, Primer Piso",
 *     "descripcion": "Laboratorio de Informática",
 *   }'
 */
AulaRouter.post(
  "/aulas",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  registerAula
);

/**
 * @name PUT /aulas/:id
 * @description Actualiza los datos de un aula existente
 * @param {number} id - ID del aula a actualizar
 * @body {Object} datosActualizados - Campos a actualizar
 * @body {string} [datosActualizados.nombre_aula] - Nuevo nombre del aula
 * @body {string} [datosActualizados.tipo_aula] - Nuevo tipo de aula
 * @body {number} [datosActualizados.capacidad] - Nueva capacidad
 * @body {string} [datosActualizados.ubicacion] - Nueva ubicación
 * @body {string} [datosActualizados.descripcion] - Nueva descripción
 * @body {string} [datosActualizados.equipamiento] - Nuevo equipamiento
 * @body {boolean} [datosActualizados.disponible] - Nuevo estado de disponibilidad
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Aula actualizada
 * @example
 * curl -X PUT 'http://localhost:3000/aulas/1' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "capacidad": 45,
 *     "equipamiento": "30 computadoras, proyector HD, aire acondicionado"
 *   }'
 */
AulaRouter.put(
  "/aulas/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  actualizarAula
);

/**
 * @name DELETE /aulas/:id
 * @description Elimina un aula del sistema (eliminación lógica)
 * @param {number} id - ID del aula a eliminar
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Confirmación de eliminación
 * @example
 * curl -X DELETE 'http://localhost:3000/aulas/1'
 */
AulaRouter.delete(
  "/aulas/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  eliminarAula
);

/**
 * =============================================
 * RUTAS ESPECÍFICAS DE AULAS
 * =============================================
 */

/**
 * @name GET /aulas/tipo/:tipo
 * @description Obtiene aulas filtradas por tipo específico
 * @param {string} tipo - Tipo de aula (teorica, laboratorio, taller, auditorio)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Array} Lista de aulas del tipo especificado
 * @example
 * curl -X GET 'http://localhost:3000/aulas/tipo/laboratorio'
 */
AulaRouter.get(
  "/aulas/tipo/:tipo",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerAulasPorTipo
);

/**
 * @name GET /aulas/sede/:sede
 * @description Obtiene aulas filtradas por sede o ubicación
 * @param {string} sede - Sede o ubicación específica
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Array} Lista de aulas de la sede especificada
 * @example
 * curl -X GET 'http://localhost:3000/aulas/sede/Edificio+A'
 */
AulaRouter.get(
  "/aulas/sede/:id_sede",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerAulasPorSede
);

/**
 * @name GET /aulas/pnf/:codigoPNF
 * @description Obtiene aulas filtradas por sede o ubicación
 * @param {string} sede - Sede o ubicación específica
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Array} Lista de aulas de la sede especificada
 * @example
 * curl -X GET 'http://localhost:3000/aulas/sede/Edificio+A'
 */
AulaRouter.get(
  "/aulas/pnf/:codigoPNF",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerAulasPorPnf
);

/**
 * @name GET /api/aulas
 * @description Obtiene listado de aulas en formato API (compatibilidad)
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 * @returns {Array} Lista de aulas en formato API
 * @example
 * curl -X GET 'http://localhost:3000/api/aulas'
 */
AulaRouter.get(
  "/api/aulas",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  mostrarAulas
);
