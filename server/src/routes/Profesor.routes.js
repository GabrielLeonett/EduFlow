import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import ProfesorController from "../controllers/profesor.controller.js";
import multer from "multer";
import path from "path";

// Destructuración de los métodos del controlador de profesores
const {
  registrarProfesor,
  getImageProfesorDirect,
  mostrarProfesorAPI,
  mostrarProfesor,
  buscarProfesor,
  mostrarPreGrados,
  mostrarPosGrados,
  mostrarAreasConocimiento,
  registerPreGrado,
  registerPosGrado,
  registerAreaConocimiento,
  crearDisponibilidad,
  actualizarDisponibilidad,
  actualizarProfesor,
  destituirProfesor,
  reingresoProfesor,
  eliminarDisponibilidad,
  mostrarDisponibilidad,
  mostrarProfesoresEliminados,
} = ProfesorController;

// Creación del router para las rutas de profesores
export const profesorRouter = Router();

/**
 * =============================================
 * CONFIGURACIÓN MULTER PARA SUBIDA DE ARCHIVOS
 * =============================================
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/profesores/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const fileExtension = path.extname(file.originalname);
    const newFileName = uniqueName + fileExtension;
    file.originalname = newFileName;
    cb(null, newFileName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * =============================================
 * RUTAS DE PROFESORES (CRUD PRINCIPAL)
 * =============================================
 */

/**
 * @name GET /profesores
 * @description Obtener listado de profesores con filtros avanzados
 * @query {string} [dedicacion] - Filtro por dedicación
 * @query {string} [categoria] - Filtro por categoría
 * @query {string} [ubicacion] - Filtro por ubicación
 * @query {string} [genero] - Filtro por género
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/profesores",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  mostrarProfesor
);

/**
 * @name GET /api/profesores
 * @description Obtener listado de profesores en formato API
 * @query {string} [dedicacion] - Filtro por dedicación
 * @query {string} [categoria] - Filtro por categoría
 * @query {string} [ubicacion] - Filtro por ubicación
 * @query {string} [genero] - Filtro por género
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/api/profesores",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  mostrarProfesorAPI
);

/**
 * @name POST /profesores
 * @description Registrar un nuevo profesor en el sistema
 * @body {Object} Datos del profesor
 * @middleware Requiere roles administrativos superiores
 */
profesorRouter.post(
  "/profesores",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  upload.single("imagen"),
  registrarProfesor
);

/**
 * @name PUT /profesores/:id
 * @description Actualizar los datos de un profesor existente
 * @param {number} id - ID del profesor a actualizar
 * @body {Object} Datos actualizados del profesor
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.put(
  "/profesores/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  actualizarProfesor
);

/**
 * @name DELETE /profesores/:id
 * @description Destituir/eliminar un profesor del sistema
 * @param {number} id - ID del profesor a destituir
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.delete(
  "/profesores/:id",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  destituirProfesor
);

/**
 * @name GET /profesores/:id
 * @description Mostrar profesores eliminados
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/profesores/eliminados",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  mostrarProfesoresEliminados
);

/**
 * @name POST /profesores/:id/reingresar
 * @description Reingresar/habilitar un profesor previamente eliminado
 * @param {number} id - ID del profesor a reingresar
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.post(
  "/profesores/reingresar",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  reingresoProfesor
);

/**
 * =============================================
 * RUTAS DE BÚSQUEDA Y RECURSOS ESPECÍFICOS
 * =============================================
 */

/**
 * @name GET /profesores/search
 * @description Buscar profesores por cédula, nombre o apellido
 * @query {string} busqueda - Término de búsqueda
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/profesores/search",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  buscarProfesor
);

/**
 * @name GET /profesores/:id/imagen
 * @description Obtener la imagen de un profesor específico
 * @param {number} id - ID del profesor
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/profesores/:id/imagen",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  getImageProfesorDirect
);

/**
 * =============================================
 * RUTAS DE DISPONIBILIDAD
 * =============================================
 */

/**
 * @name POST /profesores/:id/disponibilidad
 * @description Mostrar la disponibilidad horaria de un profesor
 * @param {number} id - ID del profesor
 * @body {Object} Datos de disponibilidad
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/profesores/:id/disponibilidad",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  mostrarDisponibilidad
);

/**
 * @name POST /profesores/:id/disponibilidad
 * @description Registrar disponibilidad horaria de un profesor
 * @param {number} id - ID del profesor
 * @body {Object} Datos de disponibilidad
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.post(
  "/profesores/:id_profesor/disponibilidad",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
    "Profesor",
  ]),
  crearDisponibilidad
);


/**
 * @name PUT /profesores/:id_profesor/disponibilidad
 * @description Actualizar disponibilidad horaria existente
 * @param {number} id_profesor - ID del profesor  
 * @body {Object} Datos de disponibilidad (incluyendo id_disponibilidad)
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.put(
  "/profesores/:id_profesor/disponibilidad",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular", 
    "Coordinador",
    "Profesor",
  ]),
  actualizarDisponibilidad
);

/**
 * @name DELETE /profesores/:id_profesor/disponibilidad/:id_disponibilidad
 * @description Eliminar disponibilidad horaria
 * @param {number} id_profesor - ID del profesor
 * @param {number} id_disponibilidad - ID de la disponibilidad a eliminar
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.delete(
  "/profesores/:id_profesor/disponibilidad/:id_disponibilidad",
  middlewareAuth([
    "SuperAdmin", 
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador", 
    "Profesor",
  ]),
  eliminarDisponibilidad
);

/**
 * =============================================
 * RUTAS DE CATÁLOGOS (PREGRADOS, POSGRADOS, ÁREAS)
 * =============================================
 */

/**
 * @name GET /catalogos/pregrados
 * @description Obtener listado de pregrados disponibles
 * @query {string} [tipo] - Filtro por tipo de pregrado
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/catalogos/pregrados",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  mostrarPreGrados
);

/**
 * @name POST /catalogos/pregrados
 * @description Registrar un nuevo pregrado en el catálogo
 * @body {Object} Datos del pregrado
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.post(
  "/catalogos/pregrados",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  registerPreGrado
);

/**
 * @name GET /catalogos/posgrados
 * @description Obtener listado de posgrados disponibles
 * @query {string} [tipo] - Filtro por tipo de posgrado
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/catalogos/posgrados",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  mostrarPosGrados
);

/**
 * @name POST /catalogos/posgrados
 * @description Registrar un nuevo posgrado en el catálogo
 * @body {Object} Datos del posgrado
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.post(
  "/catalogos/posgrados",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  registerPosGrado
);

/**
 * @name GET /catalogos/areas-conocimiento
 * @description Obtener listado de áreas de conocimiento disponibles
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.get(
  "/catalogos/areas-conocimiento",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  mostrarAreasConocimiento
);

/**
 * @name POST /catalogos/areas-conocimiento
 * @description Registrar una nueva área de conocimiento en el catálogo
 * @body {Object} Datos del área de conocimiento
 * @middleware Requiere autenticación y rol autorizado
 */
profesorRouter.post(
  "/catalogos/areas-conocimiento",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  registerAreaConocimiento
);
