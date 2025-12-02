import { Router } from "express";
import HorarioController from "../controllers/horario.controller.js";
import { middlewareAuth } from "../middlewares/auth.js";

const {
  registrarHorario,
  mostrarProfesoresParaHorario,
  mostrarAulasParaHorario,
  exportarHorarioWord,
  obtenerHorariosPorSeccion,
  obtenerHorariosPorProfesor,
  obtenerHorariosPorAula,
  actualizarHorario,
  eliminarHorario,
  mostrarProfesorCambiarHorario,
  mostrarAulaCambiarHorario,
} = HorarioController;

export const HorarioRouter = Router();

/**
 * =============================================
 * SECCIÓN DE RUTAS GET
 * =============================================
 */

/**
 * @name GET /horarios/seccion/:id_seccion
 * @description Obtener todos los horarios de una sección específica
 * @param {number} id_seccion - ID de la sección
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.get(
  "/horarios/seccion/:id_seccion",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerHorariosPorSeccion
);

/**
 * @name GET /horarios/profesor/:id_profesor
 * @description Obtener todos los horarios de un profesor específico
 * @param {number} id_profesor - ID del profesor
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.get(
  "/horarios/profesor/:id_profesor",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerHorariosPorProfesor
);

/**
 * @name GET /horarios/aula/:id_aula
 * @description Obtener todos los horarios de un aula específica
 * @param {number} id_aula - ID del aula
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.get(
  "/horarios/aula/:id_aula",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  obtenerHorariosPorAula
);

/**
 * @name POST /profesores/to/seccion/:id_seccion
 * @description Obtener información de profesores para la creación de un nuevo horario.
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.post(
  "/profesor/cambiar/horario/:id_profesor",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarProfesorCambiarHorario
);

/**
 * @name POST /profesores/to/seccion/:id_seccion
 * @description Obtener información de profesores para la creación de un nuevo horario.
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.post(
  "/aula/cambiar/horario/:id_aula",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarAulaCambiarHorario
);

/**
 * @name POST /profesores/to/seccion/:id_seccion
 * @description Obtener información de profesores para la creación de un nuevo horario.
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.post(
  "/profesores/to/seccion/:id_seccion",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarProfesoresParaHorario
);

/**
 * @name POST /aulas/to/horarios
 * @description Obtener información de aulas disponibles para la creación de un nuevo horario.
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.post(
  "/aulas/to/seccion/:id_seccion",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarAulasParaHorario
);

/**
 * @name GET /exportar/seccion/:id_seccion
 * @description Exportar horario de una sección específica a Word
 * @param {number} id_seccion - ID de la sección
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 *   - Profesor
 */
HorarioRouter.get("/exportar/seccion/:id_seccion", exportarHorarioWord);

/**
 * =============================================
 * SECCIÓN DE RUTAS POST
 * =============================================
 */

/**
 * @name POST /horarios
 * @description Crear un nuevo horario académico.
 * @body {Object} datos del nuevo horario:
 * {
 *    "id_seccion": 2,
 *    "idProfesor": 1,
 *    "idUnidadCurricular": 1,
 *    "idAula": 1,
 *    "diaSemana": "Lunes",
 *    "horaInicio": "10:20:00",
 *    "horaFin": "12:00:00",
 *    "duracion": 90
 * }
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 */
HorarioRouter.post(
  "/horarios",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  registrarHorario
);

/**
 * =============================================
 * SECCIÓN DE RUTAS PUT
 * =============================================
 */

/**
 * @name PUT /horarios/:id
 * @description Actualizar un horario existente
 * @param {number} id - ID del horario a actualizar
 * @body {Object} datos actualizados del horario
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 */
HorarioRouter.put(
  "/horarios/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  actualizarHorario
);

/**
 * =============================================
 * SECCIÓN DE RUTAS DELETE
 * =============================================
 */

/**
 * @name DELETE /horarios/:id
 * @description Eliminar un horario específico
 * @param {number} id - ID del horario a eliminar
 * @middleware Requiere uno de estos roles:
 *   - SuperAdmin
 *   - Vicerrector
 *   - Director General de Gestión Curricular
 *   - Coordinador
 */
HorarioRouter.delete(
  "/horarios/:id_horario",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  eliminarHorario
);
