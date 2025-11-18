import ValidationService from "./validation.service.js";
import NotificationService from "./notification.service.js";
import ImagenService from "./imagen.service.js";
import EmailService from "./email.service.js";
import ProfesorModel from "../models/profesor.model.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import { loadEnv, parseJSONField } from "../utils/utilis.js";
import { generarPassword, hashPassword } from "../utils/encrypted.js";

loadEnv();

/**
 * @class ProfesorService
 * @description Servicio para operaciones de negocio relacionadas con profesores
 */
export default class ProfesorService {
  static async registrarProfesor(datos, imagen, user_action) {
    const imagenService = new ImagenService("profesores");
    let imagenPath = null;

    try {
      console.log(
        "🔍 [registrarProfesor] Iniciando registro de profesor...",
        datos.areas_de_conocimiento
      );
      const Pregrados = parseJSONField(datos.pre_grado, "Pre-Grados");
      const Posgrado = parseJSONField(datos.pos_grado, "Pos-Grados");
      const Areasconocimiento = parseJSONField(
        datos.areas_de_conocimiento,
        "Areas de conocimiento"
      );

      const datosProfesor = {
        ...datos,
        pre_grado: Pregrados,
        pos_grado: Posgrado,
        areas_de_conocimiento: Areasconocimiento,
        cedula: parseInt(datos.cedula),
      };

      console.log("✅ Datos del profesor:", datosProfesor);

      // 1. Validar datos del profesor
      console.log("✅ Validando datos del profesor...");
      const validation = ValidationService.validateProfesor(datosProfesor);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en registro de profesor"
        );
      }

      // 2. Validar ID de usuario
      console.log("✅ Validando ID de usuario...");
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );

      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      // 3. Validar imagen (solo si se proporciona)
      if (imagen && imagen.originalname) {
        console.log("🖼️ Validando imagen...");
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
          console.error(
            "❌ Validación de imagen fallida:",
            validationImage.error
          );
          return FormatterResponseService.validationError(
            [{ path: "imagen", message: validationImage.error }],
            "Error de validación de imagen"
          );
        }

        console.log("✅ Imagen válida:", validationImage.message);

        // Guardar imagen y obtener la ruta
        console.log("💾 Procesando y guardando imagen...");
        imagenPath = await imagenService.processAndSaveImage(
          imagen.originalname,
          {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85,
            format: "webp",
          }
        );

        if (process.env.MODE === "DEVELOPMENT") {
          console.log("📁 Ruta de imagen guardada:", imagenPath);
        }
      } else {
        console.log("ℹ️ No se proporcionó imagen, continuando sin ella...");
      }

      // 4. Validar email
      console.log("📧 Validando email...");
      const emailService = new EmailService();
      const validationEmail = await emailService.verificarEmailConAPI(
        datos.email
      );

      if (!validationEmail.existe) {
        console.error("❌ Validación de email fallida:", validationEmail);
        return FormatterResponseService.error(
          "El email proporcionado no es válido o no existe",
          "Lo sentimos, el email proporcionado no es válido o no existe",
          400,
          "INVALID_EMAIL",
          {
            email: datos.email,
          }
        );
      }

      const contrania = await generarPassword();
      console.log("🔐 Contraseña generada:", contrania);
      const hash = await hashPassword(contrania);
      console.log("✅ Contraseña hasheada");

      // 5. Crear profesor en el modelo
      console.log("👨‍🏫 Creando profesor en base de datos...");
      const respuestaModel = await ProfesorModel.crear(
        {
          ...datosProfesor,
          imagen: imagenPath ? imagenPath.fileName : null,
          password: hash,
        },
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📊 Respuesta del modelo:", respuestaModel);
      }

      const Correo = {
        asunto: "Bienvenido/a al Sistema Académico - Credenciales de Acceso",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #2c3e50;">¡Bienvenido/a, ${datos.nombres}!</h2>
        <p>Es un placer darle la bienvenida a nuestra plataforma académica como profesor.</p>
        <p>Sus credenciales de acceso son:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0;">
          <p><strong>Usuario:</strong> ${datos.email}</p>
          <p><strong>Contraseña temporal:</strong> ${contrania}</p>
        </div>
        <p><strong>Instrucciones importantes:</strong></p>
        <ul>
          <li>Cambie su contraseña después del primer acceso</li>
          <li>Esta contraseña es temporal y de uso personal</li>
          <li>Guarde esta información en un lugar seguro</li>
        </ul>
        <p>Si tiene alguna duda, contacte al departamento de soporte técnico.</p>
      </div>
      <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; width: 100%;">
            <a href="${process.env.ORIGIN_FRONTEND}/inicio-sesion" style="display: inline-block; background-color: #1C75BA; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-bottom: 20px;">
                Acceder a la plataforma
            </a>
        </div>
      `,
      };

      const Resultado = await emailService.enviarEmail({
        Destinatario: datos.email,
        Correo: Correo,
        verificarEmail: false,
      });

      console.log("📧 Email enviado:", Resultado);

      // 6. Enviar notificaciones
      console.log("🔔 Enviando notificaciones...");
      const notificationService = new NotificationService();

      // Notificación individual para el profesor creado (solo él la ve)
      await notificationService.crearNotificacionIndividual({
        titulo: "Bienvenido al Sistema Académico",
        tipo: "profesor_registro_exitoso",
        user_id: datos.cedula,
        contenido: `¡Bienvenido ${datos.nombres} ${datos.apellidos}! Su registro como profesor ha sido exitoso.`,
        metadatos: {
          profesor_cedula: respuestaModel.data.profesor.cedula,
          profesor_nombre: `${respuestaModel.data.profesor.nombres} ${respuestaModel.data.profesor.apellidos}`,
          fecha_registro: new Date().toISOString(),
          url_action: `/academico/profesores/${respuestaModel.data.profesor.id}`,
        },
      });

      // Notificación masiva para roles administrativos (NO incluye profesores)
      await notificationService.crearNotificacionMasiva({
        titulo: "Nuevo Profesor Registrado",
        tipo: "profesor_creado",
        contenido: `Se ha registrado al profesor ${respuestaModel.data.profesor.nombres} ${respuestaModel.data.profesor.apellidos} en el sistema`,
        metadatos: {
          profesor_cedula: respuestaModel.data.profesor.cedula,
          profesor_nombre: `${respuestaModel.data.profesor.nombres} ${respuestaModel.data.profesor.apellidos}`,
          usuario_creador: user_action.id,
          fecha_registro: new Date().toISOString(),
          url_action: `/academico/profesores/${respuestaModel.data.profesor.id}`,
        },
        roles_ids: [2, 7, 8, 9, 10, 20], // Coordinador, Directores, Vicerrectoría, SuperAdmin
        users_ids: [user_action.id], // Solo el usuario que creó
      });

      console.log("🎉 Profesor registrado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Profesor creado exitosamente",
          profesor: {
            cedula: datos.cedula,
            nombres: datos.nombres,
            apellidos: datos.apellidos,
            email: datos.email,
            imagen: imagenPath,
          },
        },
        "Profesor registrado exitosamente",
        {
          status: 201,
          title: "Profesor Creado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio crear profesor:", error);
      if (imagenPath != null) {
        imagenService.deleteImage(imagenPath.fileName);
      }
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerTodos
   * @description Obtener todos los profesores con validación de parámetros
   * @param {Object} queryParams - Parámetros de consulta
   * @returns {Object} Resultado de la operación
   */
  static async obtenerTodos(queryParams = {}) {
    try {
      // Validar parámetros de consulta
      const allowedParams = ["page", "limit", "sort_order", "search"];
      const queryValidation = ValidationService.validateQueryParams(
        queryParams,
        allowedParams
      );

      if (!queryValidation.isValid) {
        return FormatterResponseService.validationError(
          queryValidation.errors,
          "Error de validación en parámetros de consulta"
        );
      }

      const respuestaModel = await ProfesorModel.obtenerTodos(allowedParams);

      // Parsear los campos JSON en cada profesor
      const profesoresProcesados = respuestaModel.data.profesores.map(
        (profesor) => ({
          ...profesor,
          areas_de_conocimiento: profesor.areas_de_conocimiento
            ? JSON.parse(profesor.areas_de_conocimiento)
            : [],
          disponibilidad: profesor.disponibilidad
            ? JSON.parse(profesor.disponibilidad)
            : [],
          pre_grados: profesor.pre_grados
            ? JSON.parse(profesor.pre_grados)
            : [],
          pos_grados: profesor.pos_grados
            ? JSON.parse(profesor.pos_grados)
            : [],
        })
      );

      // Reemplazar los datos en la respuesta
      respuestaModel.data.profesores = profesoresProcesados;

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        respuestaModel.data,
        "Profesores obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de Profesores",
        }
      );
    } catch (error) {
      console.error("Error en servicio obtener todos los profesores:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarProfesoresEliminados
   * @description Obtener todos los profesores con validación de parámetros
   * @param {Object} queryParams - Parámetros de consulta
   * @returns {Object} Resultado de la operación
   */
  static async mostrarProfesoresEliminados(queryParams = {}) {
    try {
      // Validar parámetros de consulta
      const allowedParams = ["page", "limit", "sort_order", "search"];
      const queryValidation = ValidationService.validateQueryParams(
        queryParams,
        allowedParams
      );

      if (!queryValidation.isValid) {
        return FormatterResponseService.validationError(
          queryValidation.errors,
          "Error de validación en parámetros de consulta"
        );
      }

      const respuestaModel = await ProfesorModel.mostrarProfesoresEliminados(
        allowedParams
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        respuestaModel.data,
        "Profesores obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de Profesores",
        }
      );
    } catch (error) {
      console.error("Error en servicio obtener todos los profesores:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarDisponibilidad
   * @description Obtener la disponibilidad de un profesor con validación de parámetros
   * @param {number|string} idProfesor - ID del profesor
   * @returns {Object} Resultado de la operación
   */
  static async mostrarDisponibilidad(idProfesor) {
    try {
      // 1. Validar parámetro de entrada
      if (!idProfesor) {
        return FormatterResponseService.validationError(
          ["El ID del profesor es requerido"],
          "Error en el parámetro de entrada"
        );
      }

      // 2. Validar formato del ID (asumiendo que validateId retorna { isValid: boolean, errors: array })
      const validacion = ValidationService.validateId(
        idProfesor,
        "id de profesor"
      );

      // CORRECCIÓN: La lógica estaba invertida - si NO es válido, debe retornar error
      if (!validacion.isValid) {
        return FormatterResponseService.validationError(
          validacion.errors,
          "Error en el ID del profesor"
        );
      }

      // 3. Obtener disponibilidad del modelo
      const respuestaModel = await ProfesorModel.mostrarDisponibilidad(
        idProfesor
      );

      // 4. Verificar si el modelo retornó un error
      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // 5. Verificar si hay datos
      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        return FormatterResponseService.success(
          { disponibilidades: [] },
          "No se encontró disponibilidad para el profesor",
          {
            status: 200,
            title: "Disponibilidad del Profesor",
          }
        );
      }

      // 6. Retornar éxito con los datos
      return FormatterResponseService.success(
        {
          disponibilidades: respuestaModel.data,
        },
        "Disponibilidad obtenida exitosamente",
        {
          status: 200,
          title: "Disponibilidad del Profesor",
        }
      );
    } catch (error) {
      console.error("Error en servicio mostrarDisponibilidad:", error);

      // Retornar error controlado en lugar de lanzar excepción
      return FormatterResponseService.error(
        "Error interno al obtener la disponibilidad",
        {
          status: 500,
          title: "Error del Servidor",
          details: error.message,
        }
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerConFiltros
   * @description Obtener profesores con filtros validados
   * @param {Object} filtros - Filtros de búsqueda
   * @returns {Object} Resultado de la operación
   */
  static async obtenerConFiltros(filtros = {}) {
    try {
      // Validar estructura de filtros
      const filterValidation = ValidationService.validateQueryParams(filtros, [
        "dedicacion",
        "categoria",
        "ubicacion",
        "area",
        "fecha",
        "genero",
      ]);

      if (!filterValidation.isValid) {
        return FormatterResponseService.validationError(
          filterValidation.errors,
          "Error de validación en filtros de búsqueda"
        );
      }

      const respuestaModel = await ProfesorModel.obtenerConFiltros(filtros);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          profesores: respuestaModel.data,
          total: respuestaModel.data.length,
          filtros_aplicados: filtros,
        },
        "Profesores filtrados obtenidos exitosamente",
        {
          status: 200,
          title: "Profesores Filtrados",
        }
      );
    } catch (error) {
      console.error("Error en servicio obtener profesores con filtros:", error);
      throw error;
    }
  }

  static async obtenerImagenProfesor(id_profesor, queryParams = {}) {
    try {
      console.log(
        `🔍 [obtenerImagenProfesor] Buscando imagen del profesor ID: ${id_profesor}`
      );
      console.log(queryParams);

      // Validar ID del profesor
      const idValidation = ValidationService.validateId(
        id_profesor,
        "profesor"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de profesor inválido"
        );
      }

      // Buscar información del profesor
      const respuesta = await ProfesorModel.buscar(id_profesor.toString());

      if (FormatterResponseService.isError(respuesta)) {
        return respuesta;
      }

      if (!respuesta.data || respuesta.data.length === 0) {
        return FormatterResponseService.notFound("Profesor", id_profesor);
      }

      const profesor = respuesta.data[0];

      if (profesor.imagen === null) {
        throw FormatterResponseService.error(
          "Imagen no encontrada",
          "El profesor no tiene una imagen registrada en el sistema",
          404,
          "IMAGE_NOT_FOUND",
          { profesor_id: id_profesor }
        );
      }

      console.log(
        `✅ Imagen encontrada para profesor ${profesor.nombres} ${profesor.apellidos}`
      );

      // Obtener la imagen usando el servicio de imágenes
      const servicioImagen = new ImagenService("profesores");
      const imagen = await servicioImagen.getImage(
        profesor.imagen,
        queryParams
      );

      return FormatterResponseService.success(
        imagen,
        "Imagen del profesor obtenida exitosamente",
        {
          status: 200,
          title: "Imagen del Profesor",
          profesor: {
            id: id_profesor,
            nombre: `${profesor.nombres} ${profesor.apellidos}`,
            cedula: profesor.cedula,
          },
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener imagen del profesor:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method buscar
   * @description Buscar profesores con validación de término de búsqueda
   * @param {string} busqueda - Término de búsqueda
   * @returns {Object} Resultado de la operación
   */
  static async buscar(busqueda) {
    try {
      // Validar término de búsqueda
      if (
        !busqueda ||
        typeof busqueda !== "string" ||
        busqueda.trim().length === 0
      ) {
        return FormatterResponseService.validationError(
          [
            {
              path: "busqueda",
              message:
                "El término de búsqueda es requerido y debe ser una cadena no vacía",
            },
          ],
          "Error de validación en búsqueda"
        );
      }

      const termino = busqueda.trim();

      if (termino.length < 2) {
        return FormatterResponseService.validationError(
          [
            {
              path: "busqueda",
              message:
                "El término de búsqueda debe tener al menos 2 caracteres",
            },
          ],
          "Término de búsqueda demasiado corto"
        );
      }

      const respuestaModel = await ProfesorModel.buscar(termino);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          profesores: respuestaModel.data,
          total: respuestaModel.data.length,
          termino_busqueda: termino,
        },
        "Búsqueda de profesores completada exitosamente",
        {
          status: 200,
          title: "Resultados de Búsqueda",
        }
      );
    } catch (error) {
      console.error("Error en servicio buscar profesores:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizar
   * @description Actualizar un profesor existente con validación y notificación
   * @param {Object} datos - Datos actualizados del profesor
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async actualizar(idProfesor, data, usuarioId) {
    console.log("🔧 INICIANDO actualizar profesor");
    console.log("👤 Usuario ID:", usuarioId);
    const datos = {
      ...data,
      id_profesor: parseInt(idProfesor),
    };
    console.log("📥 Datos recibidos:", datos.pos_grados);

    try {
      // Validar datos parciales del profesor
      console.log("🔍 Validando datos parciales del profesor...");
      const validation = ValidationService.validatePartialProfesor({ datos });
      console.log("✅ Resultado validación parcial:", validation);

      if (!validation.isValid) {
        console.log("❌ Validación parcial fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en actualización de profesor"
        );
      }

      // Validar que tenga ID de profesor
      console.log("🔍 Validando campos requeridos...");
      const requiredValidation = ValidationService.validateRequiredFields(
        datos,
        ["id_profesor"]
      );
      console.log("✅ Resultado validación requeridos:", requiredValidation);

      if (!requiredValidation.isValid) {
        console.log(
          "❌ Validación requeridos fallida:",
          requiredValidation.errors
        );
        return FormatterResponseService.validationError(
          requiredValidation.errors,
          "Campos requeridos faltantes"
        );
      }

      // Validar ID de usuario
      console.log("🔍 Validando ID de usuario...");
      const idValidation = ValidationService.validateId(usuarioId, "usuario");
      console.log("✅ Resultado validación ID usuario:", idValidation);

      if (!idValidation.isValid) {
        console.log("❌ Validación ID usuario fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Actualizar profesor
      console.log("🔄 Iniciando actualización en el modelo...");
      const respuestaModel = await ProfesorModel.actualizar(datos, usuarioId);
      console.log("✅ Respuesta del modelo:", respuestaModel);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.log("❌ Error en el modelo:", respuestaModel);
        return respuestaModel;
      }

      // Enviar notificaciones de actualización
      console.log("📢 Creando notificaciones...");
      const notificationService = new NotificationService();

      const camposActualizados = Object.keys(datos).filter(
        (key) => key !== "id_profesor"
      );
      console.log("📝 Campos actualizados:", camposActualizados);

      // Notificación individual para el profesor afectado
      await notificationService.crearNotificacionIndividual({
        titulo: "Sus Datos Han Sido Actualizados",
        tipo: "profesor_actualizado_propio",
        user_id: datos.cedula || idProfesor,
        contenido: `Se han actualizado sus datos personales en el sistema. Campos modificados: ${camposActualizados.join(
          ", "
        )}`,
        metadatos: {
          profesor_id: datos.id_profesor,
          campos_actualizados: camposActualizados,
          usuario_actualizador: usuarioId,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/academico/profesores/${datos.id_profesor}`,
        },
      });

      // Notificación masiva para roles administrativos
      await notificationService.crearNotificacionMasiva({
        titulo: "Profesor Actualizado",
        tipo: "profesor_actualizado",
        contenido: `Se han actualizado los datos del profesor ${datos.nombres} ${datos.apellidos}`,
        metadatos: {
          profesor_id: datos.id_profesor,
          profesor_nombre: `${datos.nombres} ${datos.apellidos}`,
          campos_actualizados: camposActualizados,
          usuario_actualizador: usuarioId,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/academico/profesores/${datos.id_profesor}`,
        },
        roles_ids: [2, 7, 8, 9, 10, 20], // Coordinador, Directores, Vicerrectoría, SuperAdmin
        users_ids: [usuarioId],
      });

      console.log("✅ Notificaciones creadas exitosamente");

      const respuestaFinal = FormatterResponseService.success(
        {
          message: "Profesor actualizado exitosamente",
          profesor_id: datos.id_profesor,
        },
        "Profesor actualizado exitosamente",
        {
          status: 200,
          title: "Profesor Actualizado",
        }
      );

      console.log("🎉 Actualización completada exitosamente:", respuestaFinal);
      return respuestaFinal;
    } catch (error) {
      console.error("💥 ERROR CRÍTICO en servicio actualizar profesor:", error);
      console.error("📌 Stack trace:", error.stack);
      console.error("📊 Datos que causaron el error:", { datos, usuarioId });
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method eliminar
   * @description Eliminar/destituir un profesor con validación y notificación
   * @param {Object} datos - Datos de la eliminación
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async destituirProfesor(datos, user_action) {
    try {
      // Validar datos de eliminación
      const requiredValidation = ValidationService.validateRequiredFields(
        datos,
        ["id_profesor", "tipo_accion", "razon"]
      );

      if (!requiredValidation.isValid) {
        return FormatterResponseService.validationError(
          requiredValidation.errors,
          "Campos requeridos faltantes para eliminación"
        );
      }

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Validar ID de profesor
      const profesorIdValidation = ValidationService.validateId(
        datos.id_profesor,
        "profesor"
      );
      if (!profesorIdValidation.isValid) {
        return FormatterResponseService.validationError(
          profesorIdValidation.errors,
          "ID de profesor inválido"
        );
      }

      // Verificar que el profesor existe
      const profesores = await ProfesorModel.obtenerTodos({
        search: datos.id_profesor,
      });
      const profesor = profesores.data.profesores.find((profe)=> profe.id_profesor === datos.id_profesor)

      if (!profesor) {
        return FormatterResponseService.notFound("Profesor", datos.id_profesor);
      }

      // Eliminar profesor
      const respuestaModel = await ProfesorModel.eliminar(
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Enviar notificaciones de eliminación/destitución
      const notificationService = new NotificationService();

      const accionTipo =
        datos.tipo_accion === "eliminar" ? "Eliminado" : "Destituido";
      const accionContenido =
        datos.tipo_accion === "eliminar" ? "eliminado" : "destituido";

      // Notificación individual para el profesor afectado
      await notificationService.crearNotificacionIndividual({
        titulo: `Usted Ha Sido ${accionTipo}`,
        tipo: `profesor_${datos.tipo_accion}_propio`,
        user_id: profesor.cedula,
        contenido: `Usted ha sido ${accionContenido} del sistema. Razón: ${datos.razon}`,
        metadatos: {
          profesor_id: datos.id_profesor,
          tipo_accion: datos.tipo_accion,
          razon: datos.razon,
          observaciones: datos.observaciones,
          fecha_efectiva: datos.fecha_efectiva,
          usuario_ejecutor: user_action.id,
          fecha_ejecucion: new Date().toISOString(),
        },
      });

      // Notificación masiva para roles administrativos
      await notificationService.crearNotificacionMasiva({
        titulo: `Profesor ${accionTipo}`,
        tipo: `profesor_${datos.tipo_accion}`,
        contenido: `Se ha ${accionContenido} al profesor ${profesor.nombres} ${profesor.apellidos} (${profesor.cedula})`,
        metadatos: {
          profesor_id: datos.id_profesor,
          profesor_cedula: profesor.cedula,
          profesor_nombre: `${profesor.nombres} ${profesor.apellidos}`,
          tipo_accion: datos.tipo_accion,
          razon: datos.razon,
          observaciones: datos.observaciones,
          fecha_efectiva: datos.fecha_efectiva,
          usuario_ejecutor: user_action.id,
          fecha_ejecucion: new Date().toISOString(),
        },
        roles_ids: [2, 7, 8, 9, 10, 20], // Coordinador, Directores, Vicerrectoría, SuperAdmin
        users_ids: [user_action.id],
      });

      return FormatterResponseService.success(
        {
          message: `Profesor ${
            datos.tipo_accion === "eliminar" ? "eliminado" : "destituido"
          } exitosamente`,
          profesor: {
            id: datos.id_profesor,
            cedula: profesor.cedula,
            nombre: `${profesor.nombres} ${profesor.apellidos}`,
            accion: datos.tipo_accion,
          },
        },
        `Profesor ${
          datos.tipo_accion === "eliminar" ? "eliminado" : "destituido"
        } exitosamente`,
        {
          status: 200,
          title: `Profesor ${accionTipo}`,
        }
      );
    } catch (error) {
      console.error("Error en servicio eliminar profesor:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method reingresoProfesor
   * @description Reingresar/habilitar un profesor con validación y notificación
   * @param {Object} datos - Datos del reingreso
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async reingresoProfesor(datos, user_action) {
    try {
      // Validar datos de reingreso
      const requiredValidation = ValidationService.validateRequiredFields(
        datos,
        ["id_profesor", "tipo_reingreso", "motivo_reingreso"]
      );

      if (!requiredValidation.isValid) {
        return FormatterResponseService.validationError(
          requiredValidation.errors,
          "Campos requeridos faltantes para reingreso"
        );
      }

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Validar ID de profesor
      const profesorIdValidation = ValidationService.validateId(
        datos.id_profesor,
        "profesor"
      );
      if (!profesorIdValidation.isValid) {
        return FormatterResponseService.validationError(
          profesorIdValidation.errors,
          "ID de profesor inválido"
        );
      }

      // Verificar que el profesor existe y está inactivo
      const profesores = await ProfesorModel.mostrarProfesoresEliminados({
        search: datos.id_profesor,
      });
      const profesor = profesores.data.profesores.find(
        (p) => p.id_profesor === datos.id_profesor
      );
      if (!profesor) {
        return FormatterResponseService.notFound("Profesor", datos.id_profesor);
      }

      // Verificar que el profesor está inactivo
      if (profesor.activo) {
        return FormatterResponseService.badRequest(
          "El profesor ya se encuentra activo en el sistema"
        );
      }

      // Reingresar profesor
      const respuestaModel = await ProfesorModel.reingresar(
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Enviar notificaciones de reingreso
      const notificationService = new NotificationService();

      const tipoReingresoMap = {
        REINGRESO: "Reingresado",
        REINCORPORACION: "Reincorporado",
        REINTEGRO: "Reintegrado",
      };

      const accionTipo =
        tipoReingresoMap[datos.tipo_reingreso] || "Reingresado";
      const accionContenido = datos.tipo_reingreso.toLowerCase();

      // Notificación individual para el profesor afectado
      await notificationService.crearNotificacionIndividual({
        titulo: `Usted Ha Sido ${accionTipo}`,
        tipo: `profesor_reingreso_propio`,
        user_id: profesor.cedula,
        contenido: `Usted ha sido ${accionContenido} en el sistema. Motivo: ${datos.motivo_reingreso}`,
        metadatos: {
          profesor_id: datos.id_profesor,
          tipo_reingreso: datos.tipo_reingreso,
          motivo_reingreso: datos.motivo_reingreso,
          observaciones: datos.observaciones,
          fecha_efectiva: datos.fecha_efectiva,
          registro_anterior_id: datos.registro_anterior_id,
          usuario_solicitante: user_action.id,
          fecha_reingreso: new Date().toISOString(),
        },
      });

      // Notificación masiva para roles administrativos
      await notificationService.crearNotificacionMasiva({
        titulo: `Profesor ${accionTipo}`,
        tipo: `profesor_reingreso`,
        contenido: `Se ha ${accionContenido} al profesor ${profesor.nombres} ${profesor.apellidos} (${profesor.cedula})`,
        metadatos: {
          profesor_id: datos.id_profesor,
          profesor_cedula: profesor.cedula,
          profesor_nombre: `${profesor.nombres} ${profesor.apellidos}`,
          tipo_reingreso: datos.tipo_reingreso,
          motivo_reingreso: datos.motivo_reingreso,
          observaciones: datos.observaciones,
          fecha_efectiva: datos.fecha_efectiva,
          registro_anterior_id: datos.registro_anterior_id,
          usuario_solicitante: user_action.id,
          fecha_reingreso: new Date().toISOString(),
        },
        roles_ids: [2, 7, 8, 9, 10, 20], // Coordinador, Directores, Vicerrectoría, SuperAdmin
        users_ids: [user_action.id],
      });

      return FormatterResponseService.success(
        {
          message: `Profesor ${accionContenido} exitosamente`,
          profesor: {
            id: datos.id_profesor,
            cedula: profesor.cedula,
            nombre: `${profesor.nombres} ${profesor.apellidos}`,
            accion: datos.tipo_reingreso,
            activo: true,
          },
        },
        `Profesor ${accionContenido} exitosamente`,
        {
          status: 200,
          title: `Profesor ${accionTipo}`,
        }
      );
    } catch (error) {
      console.error("Error en servicio reingresar profesor:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerPregrados
   * @description Obtener todos los pregrados con validación
   * @returns {Object} Resultado de la operación
   */
  static async obtenerPregrados() {
    try {
      const respuestaModel = await ProfesorModel.obtenerPregrados();

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        respuestaModel.data,
        "Pregrados obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de Pregrados",
        }
      );
    } catch (error) {
      console.error("Error en servicio obtener pregrados:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerPosgrados
   * @description Obtener todos los posgrados con validación
   * @returns {Object} Resultado de la operación
   */
  static async obtenerPosgrados() {
    try {
      const respuestaModel = await ProfesorModel.obtenerPosgrados();

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        respuestaModel.data,
        "Posgrados obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de Posgrados",
        }
      );
    } catch (error) {
      console.error("Error en servicio obtener posgrados:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAreasConocimiento
   * @description Obtener todas las áreas de conocimiento con validación
   * @returns {Object} Resultado de la operación
   */
  static async obtenerAreasConocimiento() {
    try {
      const respuestaModel = await ProfesorModel.obtenerAreasConocimiento();

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          areas_conocimiento: respuestaModel.data,
          total: respuestaModel.data.length,
        },
        "Áreas de conocimiento obtenidas exitosamente",
        {
          status: 200,
          title: "Lista de Áreas de Conocimiento",
        }
      );
    } catch (error) {
      console.error("Error en servicio obtener áreas de conocimiento:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method crearPregrado
   * @description Crear un nuevo pregrado
   * @param {Object} datos - Datos del pregrado
   * @param {string} datos.nombre - Nombre del pregrado
   * @param {string} datos.tipo - Tipo del pregrado
   * @param {object} user_action - Usuario que realiza la acción
   * @param {number} user_action.id - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async crearPregrado(datos, user_action) {
    try {
      console.log("🔍 [crearPregrado] Iniciando creación de pregrado...");

      // Validar datos del pregrado usando el nuevo método
      const validation = ValidationService.validateNuevoPregrado(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en creación de pregrado"
        );
      }

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      const respuestaModel = await ProfesorModel.crearPregrado(
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      console.log("🎉 Pregrado creado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Pregrado creado exitosamente",
          pregrado: {
            nombre: datos.nombre,
            tipo: datos.tipo,
          },
        },
        "Pregrado creado exitosamente",
        {
          status: 201,
          title: "Pregrado Creado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio crear pregrado:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method crearPosgrado
   * @description Crear un nuevo posgrado
   * @param {Object} datos - Datos del posgrado
   * @param {string} datos.nombre - Nombre del posgrado
   * @param {string} datos.tipo - Tipo del posgrado
   * @param {object} user_action - Usuario que realiza la acción
   * @param {number} user_action.id - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async crearPosgrado(datos, user_action) {
    try {
      console.log("🔍 [crearPosgrado] Iniciando creación de posgrado...");

      // Validar datos del posgrado usando el nuevo método
      const validation = ValidationService.validateNuevoPosgrado(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en creación de posgrado"
        );
      }

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      const respuestaModel = await ProfesorModel.crearPosgrado(
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      console.log("🎉 Posgrado creado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Posgrado creado exitosamente",
          posgrado: {
            nombre: datos.nombre,
            tipo: datos.tipo,
          },
        },
        "Posgrado creado exitosamente",
        {
          status: 201,
          title: "Posgrado Creado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio crear posgrado:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method crearAreaConocimiento
   * @description Crear una nueva área de conocimiento
   * @param {Object} datos - Datos del área de conocimiento
   * @param {string} datos.area_conocimiento - Nombre del área de conocimiento
   * @param {object} user_action - Usuario que realiza la acción
   * @param {number} user_action.id - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async crearAreaConocimiento(datos, user_action) {
    try {
      console.log(
        "🔍 [crearAreaConocimiento] Iniciando creación de área de conocimiento..."
      );

      // Validar datos del área de conocimiento usando el nuevo método
      const validation = ValidationService.validateNuevaAreaConocimiento(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en creación de área de conocimiento"
        );
      }

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      const respuestaModel = await ProfesorModel.crearAreaConocimiento(
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      console.log("🎉 Área de conocimiento creada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Área de conocimiento creada exitosamente",
          area_conocimiento: {
            nombre: datos.area_conocimiento,
          },
        },
        "Área de conocimiento creada exitosamente",
        {
          status: 201,
          title: "Área de Conocimiento Creada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio crear área de conocimiento:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method registrarDisponibilidad
   * @description Crear una nueva disponibilidad docente
   * @param {number} idProfesor - ID del profesor
   * @param {Object} datos - Datos de la disponibilidad
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async registrarDisponibilidad(idProfesor, datos, user_action) {
    try {
      console.log(
        "🔍 [registrarDisponibilidad] Iniciando creación de disponibilidad..."
      );
      console.log("Datos recibidos:", datos);

      // Validar datos de disponibilidad
      const validation = ValidationService.validateDisponibilidadDocente(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en creación de disponibilidad"
        );
      }

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      const respuestaModel = await ProfesorModel.crearDisponibilidad(
        idProfesor,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      console.log("🎉 Disponibilidad creada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Disponibilidad creada exitosamente",
          disponibilidad: {
            dia_semana: datos.dia_semana,
            hora_inicio: datos.hora_inicio,
            hora_fin: datos.hora_fin,
          },
        },
        "Disponibilidad creada exitosamente",
        {
          status: 201,
          title: "Disponibilidad Creada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio crear disponibilidad:", error);
      throw error;
    }
  }
}
