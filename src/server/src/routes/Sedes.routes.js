import { Router } from "express";
import SedesController from "../controllers/sedes.controller.js";
import { middlewareAuth } from "../middlewares/auth.js";

const { registerSede, mostrarSedes, obtenerSedePorId } = SedesController;

export const SedesRouter = Router();

/**
 * =============================================
 * SECCIÓN DE RUTAS GET
 * =============================================
 */

/**
 * @name GET /sedes
 * @description Obtener todas las sedes registradas
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Array} Lista de sedes
 */
SedesRouter.get(
  "/sedes",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarSedes
);

/**
 * @name GET /sedes/:id
 * @description Obtener todas las sedes registradas
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Array} Lista de sedes
 */
SedesRouter.get(
  "/sedes/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerSedePorId
);

/**
 * =============================================
 * SECCIÓN DE RUTAS POST
 * =============================================
 */

/**
 * @name POST /sedes
 * @description Crear una nueva sede
 * @body {Object} datosSede - Datos de la nueva sede
 * @body {string} datosSede.nombreSede - Nombre de la sede
 * @body {string} datosSede.ubicacionSede - Ubicación física de la sede
 * @body {string} datosSede.googleSede - Enlace de Google Maps de la sede
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Sede creada
 * @example
 * // Ejemplo de body JSON:
 * {
 *   "nombreSede": "Núcleo de Tecnología y Ciencias Administrativas",
 *   "ubicacionSede": "Los Teques, Edo. Miranda",
 *   "googleSede": "https://maps.app.goo.gl/EHHeHjA7uXgNA32s9"
 * }
 */
SedesRouter.post(
  "/sedes",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  registerSede
);

/**
 * =============================================
 * SECCIÓN DE RUTAS PUT
 * =============================================
 */

/**
 * @name PUT /sedes/:id
 * @description Actualizar una sede existente
 * @param {number} id - ID de la sede a actualizar
 * @body {Object} datosActualizados - Campos a actualizar
 * @body {string} [datosActualizados.nombreSede] - Nuevo nombre de la sede
 * @body {string} [datosActualizados.ubicacionSede] - Nueva ubicación
 * @body {string} [datosActualizados.googleSede] - Nuevo enlace de Google Maps
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 * @returns {Object} Sede actualizada
 */
SedesRouter.put(
  "/sedes/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ])
  // Aquí iría el controlador para actualizar sede
);

/**
 * =============================================
 * SECCIÓN DE RUTAS DELETE
 * =============================================
 */

/**
 * @name DELETE /sedes/:id
 * @description Eliminar una sede
 * @param {number} id - ID de la sede a eliminar
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 * @returns {Object} Confirmación de eliminación
 */
SedesRouter.delete(
  "/sedes/:id",
  middlewareAuth(["SuperAdmin", "Vicerrector"])
  // Aquí iría el controlador para eliminar sede
);

/**
 * =============================================
 * SECCIÓN DE RUTAS GET ESPECÍFICAS
 * =============================================
 */

/**
 * @name GET /sedes/:id
 * @description Obtener una sede específica por ID
 * @param {number} id - ID de la sede
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 * @returns {Object} Datos de la sede
 */
SedesRouter.get(
  "/sedes/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ])
  // Aquí iría el controlador para obtener sede por ID
);
