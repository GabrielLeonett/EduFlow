import { Router } from "express";
import { middlewareAuth } from "../middlewares/auth.js";
import AdminController from "../controllers/admin.controller.js";
import fs from "fs";

import multer from "multer";
import path from "path";

// Destructuración de los métodos del controlador de administradores
const {
  registrarAdmin,
  mostrarAdmin,
  buscarAdmin,
  actualizarAdmin,
  desactivarAdmin,
  cambiarRolAdmin,
  getProfile,
  updateProfile,
} = AdminController;

/**
 * =============================================
 * CONFIGURACIÓN MULTER PARA SUBIDA DE ARCHIVOS
 * =============================================
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/administradores/");
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

// Creación del router para las rutas de administradores
export const adminRouter = Router();

/**
 * =============================================
 * RUTAS DE ADMINISTRADORES (CRUD PRINCIPAL)
 * =============================================
 */

/**
 * @name GET /admins
 * @description Obtener listado de administradores con filtros
 * @query {string} [rol] - Filtro por rol
 * @query {string} [estado] - Filtro por estado (activo/inactivo)
 * @query {string} [fecha_registro] - Filtro por fecha de registro
 * @middleware Requiere autenticación y rol SuperAdmin
 */
adminRouter.get("/admins", middlewareAuth(["SuperAdmin"]), mostrarAdmin);

/**
 * @name POST /admins
 * @description Registrar un nuevo administrador en el sistema
 * @body {Object} Datos del administrador
 * @middleware Requiere rol SuperAdmin
 */
adminRouter.post(
  "/admins",
  middlewareAuth(["SuperAdmin"]),
  upload.single("imagen"),
  registrarAdmin
);

/**
 * @name PUT /admins/:id
 * @description Actualizar los datos de un administrador existente
 * @param {number} id - ID del administrador a actualizar
 * @body {Object} Datos actualizados del administrador
 * @middleware Requiere autenticación y rol SuperAdmin
 */
adminRouter.put("/admins/:id", middlewareAuth(["SuperAdmin"]), actualizarAdmin);

/**
 * @name DELETE /admins/:id
 * @description Desactivar un administrador del sistema (eliminación lógica)
 * @param {number} id - ID del administrador a desactivar
 * @middleware Requiere autenticación y rol SuperAdmin
 */
adminRouter.delete(
  "/admins/:id",
  middlewareAuth(["SuperAdmin"]),
  desactivarAdmin
);

/**
 * =============================================
 * RUTAS DE BÚSQUEDA Y GESTIÓN ESPECÍFICA
 * =============================================
 */

/**
 * @name GET /admins/search
 * @description Buscar administradores por cédula, nombre, email o apellido
 * @query {string} busqueda - Término de búsqueda
 * @middleware Requiere autenticación y rol SuperAdmin
 */
adminRouter.get("/admins/search", middlewareAuth(["SuperAdmin"]), buscarAdmin);


/**
 * @name PATCH /admins/:id/rol
 * @description Cambiar el rol de un administrador
 * @param {number} id - ID del administrador
 * @body {string} rol - Nuevo rol a asignar
 * @middleware Requiere autenticación y rol SuperAdmin
 */
adminRouter.patch(
  "/admins/:id/rol",
  middlewareAuth(["SuperAdmin"]),
  cambiarRolAdmin
);

/**
 * =============================================
 * RUTAS DE PERFIL Y AUTOGESTIÓN
 * =============================================
 */

/**
 * @name GET /admin/profile
 * @description Obtener el perfil del administrador autenticado
 * @middleware Requiere autenticación de cualquier administrador
 */
adminRouter.get(
  "/admin/profile",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  getProfile
);

/**
 * @name PUT /admin/profile
 * @description Actualizar el perfil del administrador autenticado
 * @body {Object} Datos actualizados del perfil
 * @middleware Requiere autenticación de cualquier administrador
 */
adminRouter.put(
  "/admin/profile",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
    "Coordinador",
  ]),
  updateProfile
);

/**
 * =============================================
 * RUTAS DE REPORTES Y ESTADÍSTICAS
 * =============================================
 */

/**
 * @name GET /admin/reports
 * @description Obtener reportes del sistema (solo SuperAdmin)
 * @middleware Requiere rol: SuperAdmin
 */
adminRouter.get(
  "/admin/reports",
  middlewareAuth(["SuperAdmin"]),
  (req, res) => {
    fs.readFile("./report/report.json", (err, data) => {
      try {
        if (err) {
          return res.status(500).json({
            status: 500,
            title: "Error del servidor",
            message: "No se pudo leer el archivo de reportes",
          });
        }
        res.json(JSON.parse(data));
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: 500,
          title: "Error del servidor",
          message: "Error al procesar el reporte",
        });
      }
    });
  }
);

/**
 * @name GET /admin/stats
 * @description Obtener estadísticas del sistema
 * @middleware Requiere autenticación y roles administrativos
 */
adminRouter.get(
  "/admin/stats",
  middlewareAuth([
    "SuperAdmin",
    "Vicerrector",
    "Director General de Gestión Curricular",
  ]),
  (req, res) => {
    // Lógica para obtener estadísticas
    res.json({
      totalProfesores: 0,
      totalAdmins: 0,
      profesoresActivos: 0,
      adminsActivos: 0,
      // ... más estadísticas
    });
  }
);

/**
 * =============================================
 * RUTAS DE LOGS Y AUDITORÍA
 * =============================================
 */

/**
 * @name GET /admin/logs
 * @description Obtener logs del sistema
 * @query {string} [fecha] - Filtro por fecha
 * @query {string} [usuario] - Filtro por usuario
 * @query {string} [accion] - Filtro por tipo de acción
 * @middleware Requiere autenticación y rol SuperAdmin
 */
adminRouter.get("/admin/logs", middlewareAuth(["SuperAdmin"]), (req, res) => {
  // Lógica para obtener logs del sistema
  res.json({
    logs: [],
    total: 0,
    pagina: 1,
  });
});
