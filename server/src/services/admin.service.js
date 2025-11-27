import AdminModel from "../models/admin.model.js";
import ValidationService from "./validation.service.js";
import NotificationService from "./notification.service.js";
import ImagenService from "./imagen.service.js";
import EmailService from "./email.service.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import { loadEnv, parseJSONField } from "../utils/utilis.js";
import { generarPassword, hashPassword } from "../utils/encrypted.js";

loadEnv();

/**
 * @class AdminService
 * @description Servicio para operaciones de negocio relacionadas con administradores
 */
export default class AdminService {
  /**
   * @static
   * @async
   * @method registrarAdmin
   */
  static async registrarAdmin(datos, imagen, user_action, req = null) {
    const imagenService = new ImagenService("administradores");
    let imagenPath = null;

    try {
      console.log("Iniciando registro de administrador...");

      const roles = parseJSONField(datos.roles, "Roles");
      datos = { ...datos, cedula: parseInt(datos.cedula), roles };

      console.log("Validando datos del administrador...");
      const validation = ValidationService.validateAdmins(datos);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación",
          req
        );
      }

      console.log("Validando ID de usuario...");
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );

      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "Error de validación",
          req
        );
      }

      if (imagen && imagen.originalname) {
        console.log("Validando imagen...");
        const validationImage = await imagenService.validateImage(
          imagen.originalname,
          {
            maxWidth: 1920,
            maxHeight: 1080,
            maxSize: 5 * 1024 * 1024,
            quality: 85,
            format: "webp",
          }
        );

        if (!validationImage.isValid) {
          return FormatterResponseService.validationError(
            [{ path: "imagen", message: validationImage.error }],
            "Error de validación",
            req
          );
        }

        imagenPath = await imagenService.processAndSaveImage(
          imagen.originalname,
          {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85,
            format: "webp",
          }
        );
      }

      console.log("Validando email...");
      const emailService = new EmailService();
      const validationEmail = await emailService.verificarEmailConAPI(
        datos.email
      );

      if (!validationEmail.existe) {
        return FormatterResponseService.error(
          "Email inválido",
          "Email inválido",
          400,
          "INVALID_EMAIL",
          { email: datos.email },
          req
        );
      }

      console.log("Generando contraseña...");
      const contrasenia = await generarPassword();
      const hash = await hashPassword(contrasenia);

      console.log("Creando administrador en base de datos...");
      const respuestaModel = await AdminModel.crear(
        {
          ...datos,
          imagen: imagenPath ? imagenPath.fileName : null,
          password: hash,
        },
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      const Correo = {
        asunto: "Bienvenido/a al Sistema Académico - Credenciales de Administrador",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #2c3e50;">¡Bienvenido/a, ${datos.nombre}! Es un placer darle la bienvenida a nuestra plataforma académica como administrador.</h2>
          <p>Sus credenciales de acceso son:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0;">
            <p><strong>Usuario:</strong> ${datos.email}</p>
            <p><strong>Contraseña temporal:</strong> ${contrasenia}</p>
          </div>
          <p><strong>Instrucciones importantes:</strong></p>
          <ul>
            <li>Cambie su contraseña después del primer acceso</li>
            <li>Esta contraseña es temporal y de uso personal</li>
            <li>Guarde esta información en un lugar seguro</li>
          </ul>
        </div>
        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; width: 100%;">
          <a href="${process.env.ORIGIN_FRONTEND}/inicio-sesion" style="display: inline-block; background-color: #1C75BA; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-bottom: 20px;">
              Acceder a la plataforma
          </a>
        </div>
        `,
      };

      console.log("Enviando email...");
      await emailService.enviarEmail({
        Destinatario: datos.email,
        Correo: Correo,
        verificarEmail: false,
      });

      console.log("Enviando notificaciones...");
      const notificationService = new NotificationService();

      await notificationService.crearNotificacionIndividual({
        titulo: "Bienvenido al Sistema como Administrador",
        tipo: "admin_registro_exitoso",
        user_id: datos.cedula,
        contenido: `¡Bienvenido ${datos.nombre} ${datos.apellido}! Su registro como administrador ha sido exitoso.`,
        metadatos: {
          admin_cedula: datos.cedula,
          admin_nombre: `${datos.nombre} ${datos.apellido}`,
          admin_rol: datos.rol,
          fecha_registro: new Date().toISOString(),
          url_action: `/administracion/administradores`,
        },
      });

      await notificationService.crearNotificacionMasiva({
        titulo: "Nuevo Administrador Registrado",
        tipo: "admin_creado",
        contenido: `Se ha registrado al administrador ${datos.nombre} ${datos.apellido} (${datos.cedula}) con rol: ${datos.rol}`,
        metadatos: {
          admin_cedula: datos.cedula,
          admin_nombre: `${datos.nombre} ${datos.apellido}`,
          admin_email: datos.email,
          admin_rol: datos.rol,
          usuario_creador: user_action.id,
          fecha_registro: new Date().toISOString(),
          url_action: `/administracion/administradores`,
        },
        roles_ids: [10, 20],
        users_ids: [user_action.id],
      });

      console.log("🎉 Administrador registrado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Administrador creado exitosamente",
          admin: {
            cedula: datos.cedula,
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            rol: datos.rol,
            imagen: imagenPath,
            estado: "activo",
          },
        },
        "Administrador creado exitosamente",
        { status: 201, title: "Administrador Creado" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio registrar administrador:", error);
      if (imagenPath != null) {
        imagenService.deleteImage(imagenPath.fileName);
      }
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarAdmin
   */
  static async mostrarAdmin(queryParams = {}, req = null) {
    try {
      console.log("Obteniendo todos los administradores...");

      const allowedParams = [
        "page",
        "limit",
        "sort",
        "order",
        "rol",
        "estado",
        "search",
      ];
      const queryValidation = ValidationService.validateQueryParams(
        queryParams,
        allowedParams
      );

      if (!queryValidation.isValid) {
        return FormatterResponseService.validationError(
          queryValidation.errors,
          "Error de validación",
          req
        );
      }

      const respuestaModel = await AdminModel.obtenerTodos(queryParams);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Si el modelo ya devuelve paginación, usarla
      if (respuestaModel.data && respuestaModel.data.pagination) {
        return FormatterResponseService.success(
          {
            administradores:
              respuestaModel.data.administradores || respuestaModel.data,
            pagination: respuestaModel.data.pagination,
          },
          "Administradores obtenidos exitosamente",
          { status: 200, title: "Lista de Administradores" },
          req
        );
      }

      // Si no hay paginación en el modelo, formatear respuesta básica
      return FormatterResponseService.success(
        {
          administradores: respuestaModel.data,
          pagination: {
            page: parseInt(queryParams.page) || 1,
            limit: parseInt(queryParams.limit) || respuestaModel.data.length,
            total: respuestaModel.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
        "Administradores obtenidos exitosamente",
        { status: 200, title: "Lista de Administradores" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar administradores:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method buscarAdmin
   */
  static async buscarAdmin(busqueda, req = null) {
    try {
      console.log(`Buscando administradores: ${busqueda}`);

      if (
        !busqueda ||
        typeof busqueda !== "string" ||
        busqueda.trim().length === 0
      ) {
        return FormatterResponseService.validationError(
          [
            {
              path: "busqueda",
              message: "El término de búsqueda es requerido",
            },
          ],
          "Error de validación",
          req
        );
      }

      const busquedaLimpia = busqueda.trim();
      const respuestaModel = await AdminModel.buscar(busquedaLimpia);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          administradores: respuestaModel.data,
          total: respuestaModel.data.length,
          busqueda: busquedaLimpia,
        },
        "Búsqueda de administradores completada",
        { status: 200, title: "Resultados de Búsqueda" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio buscar administradores:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAdminPorId
   */
  static async obtenerAdminPorId(id_admin, req = null) {
    try {
      console.log(`Buscando admin ID: ${id_admin}`);

      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "Error de validación",
          req
        );
      }

      const respuestaModel = await AdminModel.buscarPorId(id_admin);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        return FormatterResponseService.notFound(
          "Administrador no encontrado",
          id_admin,
          req
        );
      }

      const admin = respuestaModel.data[0];
      console.log(`✅ ${admin.nombre} ${admin.apellido}`);

      return FormatterResponseService.success(
        { admin: admin },
        "Perfil obtenido exitosamente",
        { status: 200, title: "Detalles del Administrador" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener admin por ID:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizarAdmin
   */
  static async actualizarAdmin(id_admin, datos, user_action, req = null) {
    try {
      console.log(`Actualizando admin ID: ${id_admin}`);

      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "Error de validación",
          req
        );
      }

      const validation = ValidationService.validatePartialAdmin(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación",
          req
        );
      }

      const userValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "Error de validación",
          req
        );
      }

      const adminExistente = await AdminModel.buscarPorId(id_admin);
      if (
        FormatterResponseService.isError(adminExistente) ||
        !adminExistente.data ||
        adminExistente.data.length === 0
      ) {
        return FormatterResponseService.notFound(
          "Administrador no encontrado",
          id_admin,
          req
        );
      }

      const adminActual = adminExistente.data[0];

      if (datos.cedula || datos.email) {
        const adminDuplicado = await AdminModel.buscarPorCedulaOEmail(
          datos.cedula || adminActual.cedula,
          datos.email || adminActual.email
        );

        if (adminDuplicado.data && adminDuplicado.data.length > 0) {
          const adminDupe = adminDuplicado.data.find(
            (admin) => admin.id_admin !== id_admin
          );
          if (adminDupe) {
            return FormatterResponseService.error(
              "Administrador ya existe",
              "Administrador ya existe",
              409,
              "ADMIN_DUPLICADO",
              {
                admin_existente: {
                  id: adminDupe.id_admin,
                  cedula: adminDupe.cedula,
                  email: adminDupe.email,
                },
              },
              req
            );
          }
        }
      }

      const respuestaModel = await AdminModel.actualizar(
        id_admin,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Administrador Actualizado",
        tipo: "admin_actualizado",
        contenido: `Se han actualizado los datos del administrador ${datos.nombre || adminActual.nombre} ${datos.apellido || adminActual.apellido}`,
        metadatos: {
          admin_id: id_admin,
          admin_cedula: datos.cedula || adminActual.cedula,
          admin_nombre: datos.nombre || adminActual.nombre,
          admin_apellido: datos.apellido || adminActual.apellido,
          campos_actualizados: Object.keys(datos),
          usuario_actualizador: user_action.id,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/administracion/administradores/${id_admin}`,
        },
        roles_ids: [10, 20],
        users_ids: [user_action.id],
      });

      console.log("✅ Administrador registrado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Administrador actualizado exitosamente",
          admin_id: id_admin,
          cambios: Object.keys(datos),
        },
        "Administrador actualizado exitosamente",
        { status: 200, title: "Administrador Actualizado" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio actualizar administrador:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method desactivarAdmin
   */
  static async desactivarAdmin(id_admin, user_action, req = null) {
    try {
      console.log(`Desactivando admin ID: ${id_admin}`);

      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "Error de validación",
          req
        );
      }

      const userValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "Error de validación",
          req
        );
      }

      const adminExistente = await AdminModel.buscarPorId(id_admin);
      if (
        FormatterResponseService.isError(adminExistente) ||
        !adminExistente.data ||
        adminExistente.data.length === 0
      ) {
        return FormatterResponseService.notFound(
          "Administrador no encontrado",
          id_admin,
          req
        );
      }

      const admin = adminExistente.data[0];

      if (parseInt(id_admin) === parseInt(user_action.id)) {
        return FormatterResponseService.error(
          "Acción no permitida sobre tu propia cuenta",
          "Acción no permitida sobre tu propia cuenta",
          403,
          "SELF_DEACTIVATION_NOT_ALLOWED",
          null,
          req
        );
      }

      if (admin.rol === "SuperAdmin") {
        const superAdminsActivos = await AdminModel.contarPorRolYEstado(
          "SuperAdmin",
          "activo"
        );
        if (superAdminsActivos.data <= 1) {
          return FormatterResponseService.error(
            "No se puede realizar esta acción sobre el último SuperAdmin",
            "No se puede realizar esta acción sobre el último SuperAdmin",
            403,
            "LAST_SUPERADMIN_NOT_ALLOWED",
            null,
            req
          );
        }
      }

      const respuestaModel = await AdminModel.desactivar(
        id_admin,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Administrador Desactivado",
        tipo: "admin_desactivado",
        contenido: `Se ha desactivado la cuenta del administrador ${admin.nombre} ${admin.apellido} (Rol: ${admin.rol})`,
        metadatos: {
          admin_id: id_admin,
          admin_cedula: admin.cedula,
          admin_nombre: admin.nombre,
          admin_apellido: admin.apellido,
          admin_rol: admin.rol,
          usuario_ejecutor: user_action.id,
          fecha_desactivacion: new Date().toISOString(),
          url_action: `/administracion/administradores`,
        },
        roles_ids: [10, 20],
        users_ids: [user_action.id],
      });

      console.log("✅ Administrador registrado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Administrador desactivado exitosamente",
          admin: {
            id: id_admin,
            cedula: admin.cedula,
            nombre: admin.nombre,
            apellido: admin.apellido,
            estado: "inactivo",
          },
        },
        "Administrador desactivado exitosamente",
        { status: 200, title: "Administrador Desactivado" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio desactivar administrador:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method cambiarRolAdmin
   */
  static async cambiarRolAdmin(
    id_admin,
    nuevos_roles,
    user_action,
    req = null
  ) {
    try {
      console.log(`Actualizando roles del admin ID: ${id_admin}`);

      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "Error de validación",
          req
        );
      }

      if (!Array.isArray(nuevos_roles)) {
        return FormatterResponseService.validationError(
          [
            {
              path: "roles",
              message: "Los roles deben ser un array de objetos",
            },
          ],
          "Error de validación",
          req
        );
      }

      for (const rol of nuevos_roles) {
        if (!rol.id_rol || !rol.nombre_rol) {
          return FormatterResponseService.validationError(
            [
              {
                path: "roles",
                message: "Cada rol debe tener id_rol y nombre_rol",
              },
            ],
            "Error de validación",
            req
          );
        }
      }

      const userValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "Error de validación",
          req
        );
      }

      const adminExistente = await AdminModel.buscarPorId(id_admin);
      if (
        FormatterResponseService.isError(adminExistente) ||
        !adminExistente.data ||
        adminExistente.data.length === 0
      ) {
        return FormatterResponseService.notFound(
          "Administrador no encontrado",
          id_admin,
          req
        );
      }

      const admin = adminExistente.data[0];

      if (parseInt(id_admin) === parseInt(user_action.id)) {
        return FormatterResponseService.error(
          "Acción no permitida sobre tu propia cuenta",
          "Acción no permitida sobre tu propia cuenta",
          403,
          "SELF_ROLE_CHANGE_NOT_ALLOWED",
          null,
          req
        );
      }

      const rolesNoModificables = [1, 2, 10, 20];
      const rolesModificables = [7, 8, 9];

      const rolesActuales = admin.roles || admin.id_roles || [];
      const nombresRolesActuales = admin.nombre_roles || [];

      const rolesNoModificablesActuales = rolesActuales.filter((rolId) =>
        rolesNoModificables.includes(rolId)
      );
      const nuevosRolesModificablesIds = nuevos_roles
        .map((rol) => rol.id_rol)
        .filter((rolId) => rolesModificables.includes(rolId));

      const rolesFinales = [
        ...rolesNoModificablesActuales,
        ...nuevosRolesModificablesIds,
      ];

      const rolesAdministrativosSeleccionados =
        nuevosRolesModificablesIds.filter((id) => [7, 8, 9].includes(id));
      if (rolesAdministrativosSeleccionados.length > 1) {
        return FormatterResponseService.validationError(
          [
            {
              path: "roles",
              message: "Solo se puede asignar un rol administrativo a la vez",
            },
          ],
          "Error de validación",
          req
        );
      }

      const tieneSuperAdminActual = rolesActuales.includes(20);
      const tieneSuperAdminFinal = rolesFinales.includes(20);

      if (tieneSuperAdminActual && !tieneSuperAdminFinal) {
        const superAdminsActivos = await AdminModel.contarPorRolYEstado(
          20,
          "activo"
        );
        if (superAdminsActivos.data <= 1) {
          return FormatterResponseService.error(
            "No se puede realizar esta acción sobre el último SuperAdmin",
            "No se puede realizar esta acción sobre el último SuperAdmin",
            403,
            "LAST_SUPERADMIN_ROLE_CHANGE_NOT_ALLOWED",
            null,
            req
          );
        }
      }

      const mapeoRoles = {
        1: "Profesor",
        2: "Coordinador",
        7: "Director/a de gestión Curricular",
        8: "Director/a de Gestión Permanente y Docente",
        9: "Secretari@ Vicerrect@r",
        10: "Vicerrector",
        20: "SuperAdmin",
      };

      const rolesAnterioresNombres = nombresRolesActuales.join(", ");
      const rolesFinalesNombres = rolesFinales
        .map((id) => mapeoRoles[id] || `Rol ${id}`)
        .join(", ");

      const respuestaModel = await AdminModel.cambiarRol(
        id_admin,
        rolesFinales,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Roles de Administrador Actualizados",
        tipo: "admin_roles_actualizados",
        contenido: `Se han actualizado los roles de ${admin.nombres} ${admin.apellidos} de "${rolesAnterioresNombres}" a "${rolesFinalesNombres}"`,
        metadatos: {
          admin_id: id_admin,
          admin_cedula: admin.cedula,
          admin_nombres: admin.nombres,
          admin_apellidos: admin.apellidos,
          roles_anteriores: rolesAnterioresNombres,
          roles_nuevos: rolesFinalesNombres,
          roles_ids_anteriores: rolesActuales,
          roles_ids_nuevos: rolesFinales,
          usuario_ejecutor: user_action.id,
          fecha_cambio: new Date().toISOString(),
          url_action: `/administracion/administradores/${id_admin}`,
        },
        roles_ids: [10, 20],
        users_ids: [user_action.id],
      });

      console.log("✅ Administrador registrado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Roles de administrador actualizados exitosamente",
          admin: {
            id: id_admin,
            cedula: admin.cedula,
            nombres: admin.nombres,
            apellidos: admin.apellidos,
            roles_anteriores: rolesAnterioresNombres,
            roles_nuevos: rolesFinalesNombres,
            roles_ids_anteriores: rolesActuales,
            roles_ids_nuevos: rolesFinales,
          },
          cambios: {
            roles_mantenidos: rolesNoModificablesActuales,
            roles_agregados: nuevosRolesModificablesIds,
            roles_eliminados: rolesActuales.filter(
              (rol) => !rolesFinales.includes(rol)
            ),
          },
        },
        "Roles de administrador actualizados exitosamente",
        { status: 200, title: "Roles Actualizados" },
        req
      );
    } catch (error) {
      console.error(
        "💥 Error en servicio cambiar roles de administrador:",
        error
      );
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method getProfile
   */
  static async getProfile(user, req = null) {
    try {
      console.log(`Obteniendo perfil del admin ID: ${user.id}`);

      const userValidation = ValidationService.validateId(user.id, "usuario");
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "Error de validación",
          req
        );
      }

      const respuestaModel = await AdminModel.buscarPorId(user.id);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        return FormatterResponseService.notFound(
          "Administrador no encontrado",
          user.id,
          req
        );
      }

      const admin = respuestaModel.data[0];
      const profileInfo = {
        id: admin.id_admin,
        cedula: admin.cedula,
        nombre: admin.nombre,
        apellido: admin.apellido,
        email: admin.email,
        rol: admin.rol,
        estado: admin.estado,
        fecha_registro: admin.fecha_registro,
        ultimo_acceso: admin.ultimo_acceso,
      };

      console.log(`✅ ${admin.nombre} ${admin.apellido}`);

      return FormatterResponseService.success(
        { profile: profileInfo },
        "Perfil obtenido exitosamente",
        { status: 200, title: "Mi Perfil" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener perfil:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method updateProfile
   */
  static async updateProfile(user, datos, req = null) {
    try {
      console.log(`Actualizando perfil del admin ID: ${user.id}`);

      const userValidation = ValidationService.validateId(user.id, "usuario");
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "Error de validación",
          req
        );
      }

      const camposPermitidos = ["nombre", "apellido", "email"];
      const datosFiltrados = {};

      for (const campo of camposPermitidos) {
        if (datos[campo] !== undefined) {
          datosFiltrados[campo] = datos[campo];
        }
      }

      if (Object.keys(datosFiltrados).length === 0) {
        return FormatterResponseService.validationError(
          [
            {
              path: "datos",
              message: "No se proporcionaron datos válidos para actualizar",
            },
          ],
          "Error de validación",
          req
        );
      }

      const validation = ValidationService.validatePartialAdmin(datosFiltrados);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación",
          req
        );
      }

      if (datosFiltrados.email) {
        const adminDuplicado = await AdminModel.buscarPorEmail(
          datosFiltrados.email
        );
        if (adminDuplicado.data && adminDuplicado.data.length > 0) {
          const adminDupe = adminDuplicado.data.find(
            (admin) => admin.id_admin !== user.id
          );
          if (adminDupe) {
            return FormatterResponseService.error(
              "Administrador ya existe",
              "Administrador ya existe",
              409,
              "EMAIL_DUPLICATED",
              {
                admin_existente: {
                  id: adminDupe.id_admin,
                  email: adminDupe.email,
                },
              },
              req
            );
          }
        }
      }

      const respuestaModel = await AdminModel.actualizarPerfil(
        user.id,
        datosFiltrados
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      console.log("✅ Administrador registrado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Perfil actualizado exitosamente",
          cambios: Object.keys(datosFiltrados),
        },
        "Perfil actualizado exitosamente",
        { status: 200, title: "Perfil Actualizado" },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio actualizar perfil:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAdminsPorRol
   */
  static async obtenerAdminsPorRol(rol, req = null) {
    try {
      console.log(`Filtrando admins por rol: ${rol}`);

      const rolesValidos = [
        "SuperAdmin",
        "Vicerrector",
        "Director General de Gestión Curricular",
        "Coordinador",
      ];
      if (!rol || !rolesValidos.includes(rol)) {
        return FormatterResponseService.validationError(
          [
            {
              path: "rol",
              message: `Rol inválido. Los roles válidos son: ${rolesValidos.join(
                ", "
              )}`,
            },
          ],
          "Error de validación",
          req
        );
      }

      const respuestaModel = await AdminModel.filtrarPorRol(rol);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          administradores: respuestaModel.data,
          total: respuestaModel.data.length,
          rol: rol,
        },
        "Administradores obtenidos exitosamente",
        { status: 200, title: `Administradores - ${rol}` },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener admins por rol:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAdminsPorEstado
   */
  static async obtenerAdminsPorEstado(estado, req = null) {
    try {
      console.log(`Filtrando admins por estado: ${estado}`);

      const estadosValidos = ["activo", "inactivo"];
      if (!estado || !estadosValidos.includes(estado)) {
        return FormatterResponseService.validationError(
          [
            {
              path: "estado",
              message: `Estado inválido. Los estados válidos son: ${estadosValidos.join(
                ", "
              )}`,
            },
          ],
          "Error de validación",
          req
        );
      }

      const respuestaModel = await AdminModel.filtrarPorEstado(estado);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          administradores: respuestaModel.data,
          total: respuestaModel.data.length,
          estado: estado,
        },
        "Administradores obtenidos exitosamente",
        { status: 200, title: `Administradores - ${estado}` },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener admins por estado:", error);
      throw error;
    }
  }
}