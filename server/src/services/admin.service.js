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
   * @method getTranslation
   * @description Obtiene traducción para el servicio admin
   */
  static getTranslation(req, key, params = {}) {
    try {
      if (req && req.t) {
        const translation = req.t(key, params);
        return translation;
      }

      // Fallback básico en español
      const fallback = {
        "admins:service.registrarAdmin.start":
          "Iniciando registro de administrador...",
        "admins:service.registrarAdmin.validating_data":
          "Validando datos del administrador...",
        "admins:service.registrarAdmin.validating_user":
          "Validando ID de usuario...",
        "admins:service.registrarAdmin.validating_image": "Validando imagen...",
        "admins:service.registrarAdmin.validating_email": "Validando email...",
        "admins:service.registrarAdmin.generating_password":
          "Generando contraseña...",
        "admins:service.registrarAdmin.creating_admin":
          "Creando administrador en base de datos...",
        "admins:service.registrarAdmin.sending_email":
          "Enviando email de bienvenida...",
        "admins:service.registrarAdmin.sending_notifications":
          "Enviando notificaciones...",
        "admins:service.registrarAdmin.success":
          "Administrador registrado exitosamente",
        "admins:service.mostrarAdmin.start":
          "Obteniendo todos los administradores...",
        "admins:service.buscarAdmin.start":
          "Buscando administradores: {{search}}",
        "admins:service.obtenerAdminPorId.start": "Buscando admin ID: {{id}}",
        "admins:service.actualizarAdmin.start": "Actualizando admin ID: {{id}}",
        "admins:service.desactivarAdmin.start": "Desactivando admin ID: {{id}}",
        "admins:service.cambiarRolAdmin.start":
          "Actualizando roles del admin ID: {{id}}",
        "admins:service.profile.get_start":
          "Obteniendo perfil del admin ID: {{id}}",
        "admins:service.profile.update_start":
          "Actualizando perfil del admin ID: {{id}}",
        "admins:service.obtenerAdminsPorRol.start":
          "Filtrando admins por rol: {{rol}}",
        "admins:service.obtenerAdminsPorEstado.start":
          "Filtrando admins por estado: {{estado}}",

        "admins:success.admin_created": "Administrador creado exitosamente",
        "admins:success.admin_updated":
          "Administrador actualizado exitosamente",
        "admins:success.admin_deactivated":
          "Administrador desactivado exitosamente",
        "admins:success.roles_updated":
          "Roles de administrador actualizados exitosamente",
        "admins:success.profile_retrieved": "Perfil obtenido exitosamente",
        "admins:success.profile_updated": "Perfil actualizado exitosamente",
        "admins:success.admins_retrieved":
          "Administradores obtenidos exitosamente",
        "admins:success.search_completed":
          "Búsqueda de administradores completada",

        "admins:errors.validation_failed": "Error de validación",
        "admins:errors.not_found": "Administrador no encontrado",
        "admins:errors.duplicate": "Administrador ya existe",
        "admins:errors.invalid_email": "Email inválido",
        "admins:errors.self_action":
          "Acción no permitida sobre tu propia cuenta",
        "admins:errors.last_superadmin":
          "No se puede realizar esta acción sobre el último SuperAdmin",

        "admins:email.welcome_subject":
          "Bienvenido/a al Sistema Académico - Credenciales de Administrador",
        "admins:email.welcome_body":
          "¡Bienvenido/a, {{name}}! Es un placer darle la bienvenida a nuestra plataforma académica como administrador.",

        "admins:notifications.welcome_title":
          "Bienvenido al Sistema como Administrador",
        "admins:notifications.welcome_content":
          "¡Bienvenido {{name}} {{lastName}}! Su registro como administrador ha sido exitoso.",
        "admins:notifications.admin_created_title":
          "Nuevo Administrador Registrado",
        "admins:notifications.admin_created_content":
          "Se ha registrado al administrador {{name}} {{lastName}} ({{cedula}}) con rol: {{rol}}",
        "admins:notifications.admin_updated_title": "Administrador Actualizado",
        "admins:notifications.admin_updated_content":
          "Se han actualizado los datos del administrador {{name}} {{lastName}}",
        "admins:notifications.admin_deactivated_title":
          "Administrador Desactivado",
        "admins:notifications.admin_deactivated_content":
          "Se ha desactivado la cuenta del administrador {{name}} {{lastName}} (Rol: {{rol}})",
        "admins:notifications.roles_updated_title":
          "Roles de Administrador Actualizados",
        "admins:notifications.roles_updated_content":
          'Se han actualizado los roles de {{name}} {{lastName}} de "{{oldRoles}}" a "{{newRoles}}"',
      };

      let translation = fallback[key] || key;

      // Interpolación básica de parámetros
      Object.keys(params).forEach((param) => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });

      return translation;
    } catch (error) {
      return key;
    }
  }

  /**
   * @static
   * @async
   * @method registrarAdmin
   */
  static async registrarAdmin(datos, imagen, user_action, req = null) {
    const imagenService = new ImagenService("administradores");
    let imagenPath = null;

    try {
      console.log(
        this.getTranslation(req, "admins:service.registrarAdmin.start")
      );

      const roles = parseJSONField(datos.roles, "Roles");
      datos = { ...datos, cedula: parseInt(datos.cedula), roles };

      console.log(
        this.getTranslation(
          req,
          "admins:service.registrarAdmin.validating_data"
        )
      );
      const validation = ValidationService.validateAdmins(datos);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
          req
        );
      }

      console.log(
        this.getTranslation(
          req,
          "admins:service.registrarAdmin.validating_user"
        )
      );
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );

      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
          req
        );
      }

      if (imagen && imagen.originalname) {
        console.log(
          this.getTranslation(
            req,
            "admins:service.registrarAdmin.validating_image"
          )
        );
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
            this.getTranslation(req, "admins:errors.validation_failed"),
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

      console.log(
        this.getTranslation(
          req,
          "admins:service.registrarAdmin.validating_email"
        )
      );
      const emailService = new EmailService();
      const validationEmail = await emailService.verificarEmailConAPI(
        datos.email
      );

      if (!validationEmail.existe) {
        return FormatterResponseService.error(
          this.getTranslation(req, "admins:errors.invalid_email"),
          this.getTranslation(req, "admins:errors.invalid_email"),
          400,
          "INVALID_EMAIL",
          { email: datos.email },
          req
        );
      }

      console.log(
        this.getTranslation(
          req,
          "admins:service.registrarAdmin.generating_password"
        )
      );
      const contrasenia = await generarPassword();
      const hash = await hashPassword(contrasenia);

      console.log(
        this.getTranslation(req, "admins:service.registrarAdmin.creating_admin")
      );
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
        asunto: this.getTranslation(req, "admins:email.welcome_subject"),
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #2c3e50;">${this.getTranslation(
            req,
            "admins:email.welcome_body",
            { name: datos.nombre }
          )}</h2>
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
          <a href="${
            process.env.ORIGIN_FRONTEND
          }/inicio-sesion" style="display: inline-block; background-color: #1C75BA; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-bottom: 20px;">
              Acceder a la plataforma
          </a>
        </div>
        `,
      };

      console.log(
        this.getTranslation(req, "admins:service.registrarAdmin.sending_email")
      );
      await emailService.enviarEmail({
        Destinatario: datos.email,
        Correo: Correo,
        verificarEmail: false,
      });

      console.log(
        this.getTranslation(
          req,
          "admins:service.registrarAdmin.sending_notifications"
        )
      );
      const notificationService = new NotificationService();

      await notificationService.crearNotificacionIndividual({
        titulo: this.getTranslation(req, "admins:notifications.welcome_title"),
        tipo: "admin_registro_exitoso",
        user_id: datos.cedula,
        contenido: this.getTranslation(
          req,
          "admins:notifications.welcome_content",
          {
            name: datos.nombre,
            lastName: datos.apellido,
          }
        ),
        metadatos: {
          admin_cedula: datos.cedula,
          admin_nombre: `${datos.nombre} ${datos.apellido}`,
          admin_rol: datos.rol,
          fecha_registro: new Date().toISOString(),
          url_action: `/administracion/administradores`,
        },
      });

      await notificationService.crearNotificacionMasiva({
        titulo: this.getTranslation(
          req,
          "admins:notifications.admin_created_title"
        ),
        tipo: "admin_creado",
        contenido: this.getTranslation(
          req,
          "admins:notifications.admin_created_content",
          {
            name: datos.nombre,
            lastName: datos.apellido,
            cedula: datos.cedula,
            rol: datos.rol,
          }
        ),
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

      console.log(
        "🎉 " +
          this.getTranslation(req, "admins:service.registrarAdmin.success")
      );

      return FormatterResponseService.success(
        {
          message: this.getTranslation(req, "admins:success.admin_created"),
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
        this.getTranslation(req, "admins:success.admin_created"),
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
      console.log(
        this.getTranslation(req, "admins:service.mostrarAdmin.start")
      );

      const allowedParams = ["page", "limit", "sort", "order", "rol", "estado",];
      const queryValidation = ValidationService.validateQueryParams(
        queryParams,
        allowedParams
      );

      if (!queryValidation.isValid) {
        return FormatterResponseService.validationError(
          queryValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
          req
        );
      }

      const respuestaModel = await AdminModel.obtenerTodos(queryParams);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          administradores: respuestaModel.data,
          total: respuestaModel.data.length,
          page: parseInt(queryParams.page) || 1,
          limit: parseInt(queryParams.limit) || respuestaModel.data.length,
        },
        this.getTranslation(req, "admins:success.admins_retrieved"),
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
      console.log(
        this.getTranslation(req, "admins:service.buscarAdmin.start", {
          search: busqueda,
        })
      );

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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
        this.getTranslation(req, "admins:success.search_completed"),
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
      console.log(
        this.getTranslation(req, "admins:service.obtenerAdminPorId.start", {
          id: id_admin,
        })
      );

      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
          req
        );
      }

      const respuestaModel = await AdminModel.buscarPorId(id_admin);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        return FormatterResponseService.notFound(
          this.getTranslation(req, "admins:errors.not_found"),
          id_admin,
          req
        );
      }

      const admin = respuestaModel.data[0];
      console.log(`✅ ${admin.nombre} ${admin.apellido}`);

      return FormatterResponseService.success(
        { admin: admin },
        this.getTranslation(req, "admins:success.profile_retrieved"),
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
      console.log(
        this.getTranslation(req, "admins:service.actualizarAdmin.start", {
          id: id_admin,
        })
      );

      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
          req
        );
      }

      const validation = ValidationService.validatePartialAdmin(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.not_found"),
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
              this.getTranslation(req, "admins:errors.duplicate"),
              this.getTranslation(req, "admins:errors.duplicate"),
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
        titulo: this.getTranslation(
          req,
          "admins:notifications.admin_updated_title"
        ),
        tipo: "admin_actualizado",
        contenido: this.getTranslation(
          req,
          "admins:notifications.admin_updated_content",
          {
            name: datos.nombre || adminActual.nombre,
            lastName: datos.apellido || adminActual.apellido,
          }
        ),
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

      console.log(
        "✅ " +
          this.getTranslation(req, "admins:service.registrarAdmin.success")
      );

      return FormatterResponseService.success(
        {
          message: this.getTranslation(req, "admins:success.admin_updated"),
          admin_id: id_admin,
          cambios: Object.keys(datos),
        },
        this.getTranslation(req, "admins:success.admin_updated"),
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
      console.log(
        this.getTranslation(req, "admins:service.desactivarAdmin.start", {
          id: id_admin,
        })
      );

      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.not_found"),
          id_admin,
          req
        );
      }

      const admin = adminExistente.data[0];

      if (parseInt(id_admin) === parseInt(user_action.id)) {
        return FormatterResponseService.error(
          this.getTranslation(req, "admins:errors.self_action"),
          this.getTranslation(req, "admins:errors.self_action"),
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
            this.getTranslation(req, "admins:errors.last_superadmin"),
            this.getTranslation(req, "admins:errors.last_superadmin"),
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
        titulo: this.getTranslation(
          req,
          "admins:notifications.admin_deactivated_title"
        ),
        tipo: "admin_desactivado",
        contenido: this.getTranslation(
          req,
          "admins:notifications.admin_deactivated_content",
          {
            name: admin.nombre,
            lastName: admin.apellido,
            rol: admin.rol,
          }
        ),
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

      console.log(
        "✅ " +
          this.getTranslation(req, "admins:service.registrarAdmin.success")
      );

      return FormatterResponseService.success(
        {
          message: this.getTranslation(req, "admins:success.admin_deactivated"),
          admin: {
            id: id_admin,
            cedula: admin.cedula,
            nombre: admin.nombre,
            apellido: admin.apellido,
            estado: "inactivo",
          },
        },
        this.getTranslation(req, "admins:success.admin_deactivated"),
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
      console.log(
        this.getTranslation(req, "admins:service.cambiarRolAdmin.start", {
          id: id_admin,
        })
      );
      
      const idValidation = ValidationService.validateId(
        id_admin,
        "administrador"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
            this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.not_found"),
          id_admin,
          req
        );
      }

      const admin = adminExistente.data[0];

      if (parseInt(id_admin) === parseInt(user_action.id)) {
        return FormatterResponseService.error(
          this.getTranslation(req, "admins:errors.self_action"),
          this.getTranslation(req, "admins:errors.self_action"),
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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
            this.getTranslation(req, "admins:errors.last_superadmin"),
            this.getTranslation(req, "admins:errors.last_superadmin"),
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
        titulo: this.getTranslation(
          req,
          "admins:notifications.roles_updated_title"
        ),
        tipo: "admin_roles_actualizados",
        contenido: this.getTranslation(
          req,
          "admins:notifications.roles_updated_content",
          {
            name: admin.nombres,
            lastName: admin.apellidos,
            oldRoles: rolesAnterioresNombres,
            newRoles: rolesFinalesNombres,
          }
        ),
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

      console.log(
        "✅ " +
          this.getTranslation(req, "admins:service.registrarAdmin.success")
      );

      return FormatterResponseService.success(
        {
          message: this.getTranslation(req, "admins:success.roles_updated"),
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
        this.getTranslation(req, "admins:success.roles_updated"),
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
      console.log(
        this.getTranslation(req, "admins:service.profile.get_start", {
          id: user.id,
        })
      );

      const userValidation = ValidationService.validateId(user.id, "usuario");
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
          req
        );
      }

      const respuestaModel = await AdminModel.buscarPorId(user.id);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        return FormatterResponseService.notFound(
          this.getTranslation(req, "admins:errors.not_found"),
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
        this.getTranslation(req, "admins:success.profile_retrieved"),
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
      console.log(
        this.getTranslation(req, "admins:service.profile.update_start", {
          id: user.id,
        })
      );

      const userValidation = ValidationService.validateId(user.id, "usuario");
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
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
          this.getTranslation(req, "admins:errors.validation_failed"),
          req
        );
      }

      const validation = ValidationService.validatePartialAdmin(datosFiltrados);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          this.getTranslation(req, "admins:errors.validation_failed"),
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
              this.getTranslation(req, "admins:errors.duplicate"),
              this.getTranslation(req, "admins:errors.duplicate"),
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

      console.log(
        "✅ " +
          this.getTranslation(req, "admins:service.registrarAdmin.success")
      );

      return FormatterResponseService.success(
        {
          message: this.getTranslation(req, "admins:success.profile_updated"),
          cambios: Object.keys(datosFiltrados),
        },
        this.getTranslation(req, "admins:success.profile_updated"),
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
      console.log(
        this.getTranslation(req, "admins:service.obtenerAdminsPorRol.start", {
          rol: rol,
        })
      );

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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
        this.getTranslation(req, "admins:success.admins_retrieved"),
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
      console.log(
        this.getTranslation(
          req,
          "admins:service.obtenerAdminsPorEstado.start",
          { estado: estado }
        )
      );

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
          this.getTranslation(req, "admins:errors.validation_failed"),
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
        this.getTranslation(req, "admins:success.admins_retrieved"),
        { status: 200, title: `Administradores - ${estado}` },
        req
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener admins por estado:", error);
      throw error;
    }
  }
}
