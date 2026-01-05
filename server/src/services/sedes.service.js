import ValidationService from "./validation.service.js";
import SedeModel from "../models/sedes.model.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import NotificationService from "./notification.service.js";

/**
 * @class SedeService
 * @description Servicio para operaciones de negocio relacionadas con sedes
 */
export default class SedeService {
  /**
   * @static
   * @async
   * @method registrarSede
   * @description Registrar una nueva sede
   * @param {Object} datos - Datos de la sede
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async registrarSede(datos, user_action) {
    try {
      console.log("🔍 [registrarSede] Iniciando registro de sede...");

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar datos de la sede
      console.log("✅ Validando datos de la sede...");
      const validation = ValidationService.validateSede(datos);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en registro de sede"
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

      // 3. Crear sede en el modelo
      console.log("🏢 Creando sede en base de datos...");
      const respuestaModel = await SedeModel.crearSede(datos, user_action.id);

      // Verificar si la respuesta del modelo indica error
      if (respuestaModel.state === "error" || respuestaModel.status >= 400) {
        console.error("❌ Error en modelo crear sede:", respuestaModel);

        // Convertir la respuesta del modelo al formato del servicio
        return FormatterResponseService.error(
          respuestaModel.title || "Error en base de datos",
          respuestaModel.message || "Error al crear la sede",
          respuestaModel.status || 500,
          respuestaModel.code || "DB_ERROR",
          {
            originalError:
              process.env.MODE === "DEVELOPMENT" ? respuestaModel : undefined,
          }
        );
      }

      // 4. Enviar notificación GLOBAL (para todos los usuarios)
      console.log("🔔 Enviando notificación GLOBAL...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Nueva Sede Registrada",
        tipo: "sede_creada",
        contenido: `Se ha registrado la sede "${datos.nombreSede}" en el sistema. Ubicación: ${datos.UbicacionSede}`,
        metadatos: {
          sede_nombre: datos.nombreSede,
          sede_direccion: datos.UbicacionSede,
          google_maps: datos.GoogleSede,
          usuario_creador: user_action.id,
          fecha_registro: new Date().toISOString(),
          url_action: `/sedes/${respuestaModel.data?.id_sede || respuestaModel.data?.id}`,
        },
        // NO se pasan roles_ids ni users_ids → Notificación global para todos
      });

      console.log("🎉 Sede registrada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Sede creada exitosamente",
          sede: {
            id: respuestaModel.data?.id_sede || respuestaModel.data?.id,
            nombre: datos.nombreSede,
            direccion: datos.UbicacionSede,
            google_maps: datos.GoogleSede,
            estado: "activa",
          },
        },
        "Sede registrada exitosamente",
        {
          status: 201,
          title: "Sede Creada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio registrar sede:", error);

      // Si es un error conocido del modelo, convertirlo a respuesta del servicio
      if (error.state === "error" || error.status >= 400) {
        return FormatterResponseService.error(
          error.title || "Error en base de datos",
          error.message || "Error al crear la sede",
          error.status || 500,
          error.code || "DB_ERROR",
          {
            originalError:
              process.env.MODE === "DEVELOPMENT" ? error : undefined,
          }
        );
      }

      // Para errores inesperados, propagar la excepción
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarSedes
   * @description Obtener todas las sedes registradas
   * @returns {Object} Resultado de la operación
   */
  static async mostrarSedes() {
    try {
      console.log("🔍 [mostrarSedes] Obteniendo listado de sedes...");

      const respuestaModel = await SedeModel.mostrarSedes();

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo mostrar sedes:", respuestaModel);
        return respuestaModel;
      }
      const Sedes = respuestaModel.data || [];

      // Agrupar PNFs por sede
      const pnfsPorSede = {};

      // Recorrer todos los datos
      Sedes.forEach((item) => {
        // Si el tiene datos de sede (esto siempre debe existir)
        if (item.id_sede) {
          const sedeId = item.id_sede;

          // Si es la primera vez que vemos esta sede, inicializar el array
          if (!pnfsPorSede[sedeId]) {
            pnfsPorSede[sedeId] = {
              id_sede: item.id_sede,
              nombre_sede: item.nombre_sede,
              ubicacion_sede: item.ubicacion_sede,
              google_sede: item.google_sede,
              created_at: item.created_at,
              updated_at: item.updated_at,
              pnfs: [],
            };
          }

          // Agregar el PNF al array de la sede (solo si tiene datos de PNF)
          if (item.id_pnf) {
            pnfsPorSede[sedeId].pnfs.push({
              id_pnf: item.id_pnf,
              codigo_pnf: item.codigo_pnf,
              nombre_pnf: item.nombre_pnf,
              descripcion_pnf: item.descripcion_pnf,
              poblacion_estudiantil_pnf: item.poblacion_estudiantil_pnf,
              activo: item.activo,
            });
          }
        }
      });

      // Convertir el objeto a array
      const FormatSedes = Object.values(pnfsPorSede);

      console.log(`✅ Se obtuvieron ${FormatSedes.length} sedes`);

      return FormatterResponseService.success(
        {
          sedes: FormatSedes,
          total: FormatSedes.length,
        },
        "Sedes obtenidas exitosamente",
        {
          status: 200,
          title: "Lista de Sedes",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar sedes:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerSedePorId
   * @description Obtener una sede específica por ID
   * @param {number} id - ID de la sede
   * @returns {Object} Resultado de la operación
   */
  static async obtenerSedePorId(id) {
    try {
      console.log("🔍 [obtenerSedePorId] Buscando sede ID:", id);

      // Validar ID de la sede
      const idValidation = ValidationService.validateId(id, "sede");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de sede inválido"
        );
      }

      const respuestaModel = await SedeModel.obtenerSedePorId(id);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error(
          "❌ Error en modelo obtener sede por ID:",
          respuestaModel
        );
        return respuestaModel;
      }

      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        console.error("❌ Sede no encontrada:", id);
        return FormatterResponseService.notFound("Sede", id);
      }

      const datosSede = respuestaModel.data;
      console.log("💾 Datos crudos de la sede:", datosSede);
      // Formatear la sede con sus PNFs
      const sedeFormateada = {
        id_sede: datosSede[0].id_sede,
        nombre_sede: datosSede[0].nombre_sede,
        ubicacion_sede: datosSede[0].ubicacion_sede,
        google_sede: datosSede[0].google_sede,
        created_at: datosSede[0].created_at,
        updated_at: datosSede[0].updated_at,
        pnfs: [],
      };

      // Agregar los PNFs a la sede
      datosSede.forEach((item) => {
        if (item.id_pnf) {
          sedeFormateada.pnfs.push({
            id_pnf: item.id_pnf,
            codigo_pnf: item.codigo_pnf,
            nombre_pnf: item.nombre_pnf,
            descripcion_pnf: item.descripcion_pnf,
            poblacion_estudiantil_pnf: item.poblacion_estudiantil_pnf,
            activo: item.activo,
          });
        }
      });

      console.log("✅ Sede formateada:", sedeFormateada);

      return FormatterResponseService.success(
        sedeFormateada, // ← Enviar el objeto formateado, no el array
        "Sede obtenida exitosamente",
        {
          status: 200,
          title: "Sede Encontrada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener sede por ID:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizarSede
   * @description Actualizar una sede existente
   * @param {number} id - ID de la sede
   * @param {Object} datos - Datos actualizados
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async actualizarSede(id, datos, user_action) {
    try {
      console.log("🔍 [actualizarSede] Actualizando sede ID:", id);

      if (process.env.MODE === "DEVELOPMENT") {
        console.log(
          "📝 Datos de actualización:",
          JSON.stringify(datos, null, 2)
        );
      }

      // 1. Validar ID de la sede
      const idValidation = ValidationService.validateId(id, "sede");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de sede inválido"
        );
      }

      // 2. Validar ID de usuario
      const usuarioValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!usuarioValidation.isValid) {
        console.error(
          "❌ Validación de usuario fallida:",
          usuarioValidation.errors
        );
        return FormatterResponseService.validationError(
          usuarioValidation.errors,
          "ID de usuario inválido"
        );
      }

      // 3. Validar datos parciales de la sede
      const validation = ValidationService.validatePartialSede(datos);
      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en actualización de sede"
        );
      }

      // 4. Verificar que la sede existe
      const sedeExistente = await SedeModel.obtenerSedePorId(id);
      if (
        FormatterResponseService.isError(sedeExistente) ||
        !sedeExistente.data ||
        sedeExistente.data.length === 0
      ) {
        console.error("❌ Sede no encontrada para actualizar:", id);
        return FormatterResponseService.notFound("Sede", id);
      }

      // 5. Actualizar sede en el modelo
      console.log("💾 Actualizando sede en base de datos...");
      const respuestaModel = await SedeModel.actualizarSede(
        id,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo actualizar sede:", respuestaModel);
        return respuestaModel;
      }

      // 6. Enviar notificación GLOBAL (para todos los usuarios)
      console.log("🔔 Enviando notificación GLOBAL de actualización...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Sede Actualizada",
        tipo: "sede_actualizada",
        contenido: `Se han actualizado los datos de la sede "${sedeExistente.data[0].nombre_sede}". Cambios realizados: ${Object.keys(datos).join(', ')}`,
        metadatos: {
          sede_id: id,
          sede_nombre: sedeExistente.data[0].nombre_sede,
          campos_actualizados: Object.keys(datos),
          usuario_actualizador: user_action.id,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/sedes/${id}`,
        },
        // NO se pasan roles_ids ni users_ids → Notificación global para todos
      });

      console.log("✅ Sede actualizada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Sede actualizada exitosamente",
          sede_id: id,
          cambios: datos,
        },
        "Sede actualizada exitosamente",
        {
          status: 200,
          title: "Sede Actualizada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio actualizar sede:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method eliminarSede
   * @description Eliminar una sede específica
   * @param {number} id - ID de la sede
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async eliminarSede(id, user_action) {
    try {
      console.log("🔍 [eliminarSede] Eliminando sede ID:", id);

      // 1. Validar ID de la sede
      const idValidation = ValidationService.validateId(id, "sede");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de sede inválido"
        );
      }

      // 2. Validar ID de usuario
      const usuarioValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!usuarioValidation.isValid) {
        console.error(
          "❌ Validación de usuario fallida:",
          usuarioValidation.errors
        );
        return FormatterResponseService.validationError(
          usuarioValidation.errors,
          "ID de usuario inválido"
        );
      }

      // 3. Verificar que la sede existe
      const sedeExistente = await SedeModel.obtenerSedePorId(id);
      if (
        FormatterResponseService.isError(sedeExistente) ||
        !sedeExistente.data ||
        sedeExistente.data.length === 0
      ) {
        console.error("❌ Sede no encontrada para eliminar:", id);
        return FormatterResponseService.notFound("Sede", id);
      }

      const sede = sedeExistente.data[0];

      // 5. Eliminar sede en el modelo
      console.log("🗑️ Eliminando sede de base de datos...");
      const respuestaModel = await SedeModel.eliminarSede(id, user_action.id);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo eliminar sede:", respuestaModel);
        return respuestaModel;
      }

      // 6. Enviar notificación GLOBAL (para todos los usuarios)
      console.log("🔔 Enviando notificación GLOBAL de eliminación...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Sede Eliminada",
        tipo: "sede_eliminada",
        contenido: `Se ha eliminado la sede "${sede.nombre_sede}" del sistema. Ubicación anterior: ${sede.ubicacion_sede}`,
        metadatos: {
          sede_id: id,
          sede_nombre: sede.nombre_sede,
          sede_direccion: sede.ubicacion_sede,
          usuario_eliminador: user_action.id,
          fecha_eliminacion: new Date().toISOString(),
        },
        // NO se pasan roles_ids ni users_ids → Notificación global para todos
      });

      console.log("✅ Sede eliminada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Sede eliminada exitosamente",
          sede: {
            id: id,
            nombre: sede.nombre_sede,
          },
        },
        "Sede eliminada exitosamente",
        {
          status: 200,
          title: "Sede Eliminada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio eliminar sede:", error);
      throw error;
    }
  }
}