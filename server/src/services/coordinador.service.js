import ValidationService from "./validation.service.js";
import NotificationService from "./notification.service.js";
import CoordinadorModel from "../models/coordinador.model.js";
import CurricularModel from "../models/curricular.model.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import { loadEnv } from "../utils/utilis.js";

loadEnv();

/**
 * @class CoordinadorService
 * @description Servicio para operaciones de negocio relacionadas con coordinadores
 */
export default class CoordinadorService {
  /**
   * @static
   * @async
   * @method asignarCoordinador
   * @description Asigna un profesor como coordinador de un PNF
   * @param {Object} datos - Datos de asignación del coordinador
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async asignarCoordinador(datos, user_action) {
    try {
      console.log(
        "🔍 [asignarCoordinador] Iniciando asignación de coordinador..."
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar datos de asignación
      console.log("✅ Validando datos de asignación...");
      const validation = ValidationService.validateAsignacionCoordinador(datos);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en asignación de coordinador"
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

      // 6. Asignar coordinador en el modelo
      console.log("👑 Asignando coordinador en base de datos...");
      const respuestaModel = await CoordinadorModel.asignarCoordinador(
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📊 Respuesta del modelo:", respuestaModel);
      }

      // 7. Enviar notificación
      console.log("🔔 Enviando notificaciones...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Nuevo Coordinador Asignado",
        tipo: "coordinador_asignado",
        contenido: `Se ha asignado al profesor ${respuestaModel.data.coordinador.nombres} como coordinador del PNF ${respuestaModel.data.coordinador.nombre_pnf}`,
        metadatos: {
          coordinador_cedula: datos.cedula,
          coordinador_nombre: respuestaModel.data.coordinador.nombres,
          pnf_id: datos.id_pnf,
          pnf_nombre: respuestaModel.data.coordinador.nombre_pnf,
          fecha_inicio: datos.fecha_inicio,
          usuario_asignador: user_action.id,
          fecha_asignacion: new Date().toISOString(),
        },
        roles_ids: [7, 8, 9, 10], // IDs de roles administrativos
        users_ids: [],
      });

      console.log("🎉 Coordinador asignado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Coordinador asignado exitosamente",
          coordinador: {
            cedula: datos.cedula_profesor,
            nombre: profesorValidation.nombre,
            pnf: pnfValidation.nombre,
            fecha_inicio: datos.fecha_inicio,
            fecha_fin: datos.fecha_fin || null,
          },
        },
        "Coordinador asignado exitosamente",
        {
          status: 201,
          title: "Coordinador Asignado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio asignar coordinador:", error);
      throw error;
    }
  }
  /**
   * @static
   * @async
   * @method reasignarCoordinador
   * @description Reasigna un coordinador existente a otro PNF
   * @param {Object} datos - Datos de reasignación del coordinador
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async reasignarCoordinador(datos, user_action) {
    try {
      console.log(
        "🔍 [reasignarCoordinador] Iniciando reasignación de coordinador..."
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar datos de reasignación
      console.log("✅ Validando datos de reasignación...");
      const validation = ValidationService.validatePartialCoordinador(datos);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en reasignación de coordinador"
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

      // 3. Validar que el coordinador existe y está activo
      console.log("👤 Validando existencia del coordinador...");
      const coordinadorValidation =
        await CoordinadorModel.validarCoordinadorActivo(datos.id_profesor);

      if (!coordinadorValidation.existe) {
        console.error("❌ Coordinador no encontrado o inactivo");
        return FormatterResponseService.validationError(
          ["El coordinador especificado no existe o no está activo"],
          "Coordinador no válido para reasignación"
        );
      }

      // 5. Validar que no es el mismo PNF
      if (coordinadorValidation.pnf_actual === datos.id_pnf_nuevo) {
        console.error("❌ Intento de reasignación al mismo PNF");
        return FormatterResponseService.validationError(
          ["No se puede reasignar al coordinador al mismo PNF"],
          "Reasignación al mismo PNF no permitida"
        );
      }

      // 6. Validar que no hay otro coordinador activo en el PNF destino
      console.log("🔍 Verificando coordinador en PNF destino...");
      const coordinadorDestino =
        await CoordinadorModel.obtenerCoordinadorPorPnf(datos.id_pnf_nuevo); // Corregido: datos.id_pnf_nuevo

      if (coordinadorDestino && coordinadorDestino.activo) {
        console.error("❌ Ya existe coordinador activo en PNF destino");
        return FormatterResponseService.validationError(
          [
            `Ya existe un coordinador activo en el PNF destino: ${coordinadorDestino.nombre_pnf}`,
          ],
          "PNF destino ya tiene coordinador asignado"
        );
      }

      // 7. Reasignar coordinador en el modelo
      console.log("🔄 Reasignando coordinador en base de datos...");
      const respuestaModel = await CoordinadorModel.reasignarCoordinador(
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      // Extraer datos de la respuesta del modelo
      const datosCoordinador = respuestaModel.data.coordinador;
      const pnf_anterior = datosCoordinador.pnf_anterior; // { id_pnf, nombre_pnf }
      const pnf_nuevo = datosCoordinador.pnf_nuevo; // { id_pnf, nombre_pnf }

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📊 Respuesta del modelo:", respuestaModel);
        console.log("🏷️ Coordinador:", datosCoordinador);
        console.log("🏷️ PNF Anterior:", pnf_anterior);
        console.log("🏷️ PNF Nuevo:", pnf_nuevo);
      }

      // 9. Enviar notificación
      console.log("🔔 Enviando notificaciones de reasignación...");
      const notificationService = new NotificationService();
      
      // Notificación para roles administrativos
      await notificationService.crearNotificacionMasiva({
        titulo: "Coordinador Reasignado",
        tipo: "coordinador_reasignado",
        contenido: `El coordinador ${coordinadorValidation.nombre} ha sido reasignado del PNF "${pnf_anterior.nombre_pnf}" al PNF "${pnf_nuevo.nombre_pnf}"`,
        metadatos: {
          coordinador_cedula: datos.cedula_profesor,
          coordinador_nombre: coordinadorValidation.nombre,
          coordinador_email: coordinadorValidation.email,
          pnf_anterior_id: pnf_anterior.id_pnf,
          pnf_anterior_nombre: pnf_anterior.nombre_pnf,
          pnf_nuevo_id: pnf_nuevo.id_pnf,
          pnf_nuevo_nombre: pnf_nuevo.nombre_pnf,
          usuario_reasignador: user_action.id,
          usuario_reasignador_nombre: user_action.nombre || "Sistema",
          fecha_reasignacion: new Date().toISOString(),
        },
        roles_ids: [7, 8, 9, 10], // IDs de roles administrativos
        users_ids: [],
      });

      // Notificación específica para el coordinador reasignado
      await notificationService.crearNotificacionMasiva({
        titulo: "Ha sido reasignado a nuevo PNF",
        tipo: "coordinador_reasignado_personal",
        contenido: `Ha sido reasignado como coordinador del PNF "${pnf_nuevo.nombre_pnf}". Anteriormente coordinaba el PNF "${pnf_anterior.nombre_pnf}".`,
        metadatos: {
          pnf_anterior_id: pnf_anterior.id_pnf,
          pnf_anterior_nombre: pnf_anterior.nombre_pnf,
          pnf_nuevo_id: pnf_nuevo.id_pnf,
          pnf_nuevo_nombre: pnf_nuevo.nombre_pnf,
          usuario_reasignador: user_action.id,
          usuario_reasignador_nombre: user_action.nombre || "Sistema",
          fecha_reasignacion: new Date().toISOString(),
        },
        roles_ids: [],
        users_ids: [datosCoordinador.id_coordinador], // Notificar específicamente al coordinador por su cédula
      });

      console.log("🎉 Coordinador reasignado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Coordinador reasignado exitosamente",
          coordinador: {
            cedula: datosCoordinador.id_coordinador,
            nombre: coordinadorValidation.nombre,
            email: coordinadorValidation.email,
            pnf_anterior: {
              id_pnf: pnf_anterior.id_pnf,
              nombre_pnf: pnf_anterior.nombre_pnf,
            },
            pnf_nuevo: {
              id_pnf: pnf_nuevo.id_pnf,
              nombre_pnf: pnf_nuevo.nombre_pnf,
            },
            fecha_reasignacion: new Date().toISOString(),
            reasignado_por: {
              id: user_action.id,
              nombre: user_action.nombre || "Sistema",
            },
          },
        },
        "Coordinador reasignado exitosamente",
        {
          status: 200,
          title: "Coordinador Reasignado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio reasignar coordinador:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method listarCoordinadores
   * @description Obtiene el listado de todos los coordinadores activos
   * @param {Object} queryParams - Parámetros de consulta
   * @returns {Object} Resultado de la operación
   */
  static async listarCoordinadores(queryParams = {}) {
    try {
      console.log(
        "🔍 [listarCoordinadores] Obteniendo listado de coordinadores activos..."
      );

      // Validar parámetros de consulta
      const allowedParams = [
        "page",
        "limit",
        "sort",
        "order",
        "id_pnf",
        "cedula",
        "nombre_pnf",
        "tipo_accion",
        "estado",
        "search",
      ];
      const queryValidation = ValidationService.validateQueryParams(
        queryParams,
        allowedParams
      );

      if (!queryValidation.isValid) {
        console.error(
          "❌ Validación de parámetros fallida:",
          queryValidation.errors
        );
        return FormatterResponseService.validationError(
          queryValidation.errors,
          "Error de validación en parámetros de consulta"
        );
      }

      const respuestaModel = await CoordinadorModel.obtenerTodos(
        queryParams
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      console.log(
        `✅ Se encontraron ${
          respuestaModel.data?.length || 0
        } coordinadores activos`
      );

      return FormatterResponseService.success(
        {
          coordinadores: respuestaModel.data,
          total: respuestaModel.data?.length || 0,
          page: parseInt(queryParams.page) || 1,
          limit:
            parseInt(queryParams.limit) || respuestaModel.data?.length || 0,
        },
        "Coordinadores obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de Coordinadores Activos",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio listar coordinadores:", error);
      throw error;
    }
  }
  /**
   * @static
   * @async
   * @method listarCoordinadoresDestituidos
   * @description Obtiene el listado de todos los coordinadores activos
   * @param {Object} queryParams - Parámetros de consulta
   * @returns {Object} Resultado de la operación
   */
  static async listarCoordinadoresDestituidos(queryParams = {}) {
    try {
      console.log(
        "🔍 [listarCoordinadoresDestituidos] Obteniendo listado de coordinadores activos..."
      );

      // Validar parámetros de consulta
      const allowedParams = [
        "page",
        "limit",
        "sort",
        "order",
        "id_pnf",
        "cedula",
        "nombre_pnf",
        "sort_order",
        "tipo_accion",
        "estado",
        "search",
      ];
      const queryValidation = ValidationService.validateQueryParams(
        queryParams,
        allowedParams
      );

      if (!queryValidation.isValid) {
        console.error(
          "❌ Validación de parámetros fallida:",
          queryValidation.errors
        );
        return FormatterResponseService.validationError(
          queryValidation.errors,
          "Error de validación en parámetros de consulta"
        );
      }

      const respuestaModel = await CoordinadorModel.listarCoordinadoresDestituidos(
        queryParams
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      console.log(
        `✅ Se encontraron ${
          respuestaModel.data?.length || 0
        } coordinadores activos`
      );

      return FormatterResponseService.success(
        {
          coordinadores: respuestaModel.data,
          total: respuestaModel.data?.length || 0,
          page: parseInt(queryParams.page) || 1,
          limit:
            parseInt(queryParams.limit) || respuestaModel.data?.length || 0,
        },
        "Coordinadores Destituidos obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de Coordinadores Activos",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio listar coordinadores:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerCoordinador
   * @description Obtiene los detalles de un coordinador específico
   * @param {number} cedula - Cédula del coordinador
   * @returns {Object} Resultado de la operación
   */
  static async obtenerCoordinador(cedula) {
    try {
      console.log(
        `🔍 [obtenerCoordinador] Buscando coordinador cédula: ${cedula}`
      );

      // Validar cédula
      const cedulaValidation = ValidationService.validateCedula(cedula);
      if (!cedulaValidation.isValid) {
        console.error(
          "❌ Validación de cédula fallida:",
          cedulaValidation.errors
        );
        return FormatterResponseService.validationError(
          cedulaValidation.errors,
          "Cédula de coordinador inválida"
        );
      }

      const respuestaModel = await CoordinadorModel.obtenerCoordinador(cedula);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        console.error("❌ Coordinador no encontrado:", cedula);
        return FormatterResponseService.notFound("Coordinador", cedula);
      }

      const coordinador = respuestaModel.data[0];

      console.log(
        `✅ Coordinador encontrado: ${coordinador.nombres} ${coordinador.apellidos}`
      );

      return FormatterResponseService.success(
        coordinador,
        "Coordinador obtenido exitosamente",
        {
          status: 200,
          title: "Coordinador Encontrado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener coordinador:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizarCoordinador
   * @description Actualiza los datos de un coordinador existente
   * @param {number} id - ID del coordinador
   * @param {Object} datos - Datos actualizados del coordinador
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async actualizarCoordinador(id, datos, user_action) {
    try {
      console.log(
        `🔍 [actualizarCoordinador] Actualizando coordinador ID: ${id}`
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          id: id,
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar ID del coordinador
      const idValidation = ValidationService.validateId(id, "coordinador");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de coordinador inválido"
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

      // 3. Validar datos de actualización
      const validation =
        ValidationService.validateActualizacionCoordinador(datos);
      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en actualización de coordinador"
        );
      }

      // 4. Verificar que el coordinador existe
      const coordinadorExistente =
        await CoordinadorModel.obtenerCoordinadorPorId(id);

      if (FormatterResponseService.isError(coordinadorExistente)) {
        return coordinadorExistente;
      }

      if (
        !coordinadorExistente.data ||
        coordinadorExistente.data.length === 0
      ) {
        console.error("❌ Coordinador no encontrado:", id);
        return FormatterResponseService.notFound("Coordinador", id);
      }

      // 5. Actualizar coordinador en el modelo
      console.log("📝 Actualizando coordinador en base de datos...");
      const respuestaModel = await CoordinadorModel.actualizarCoordinador(
        id,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      // 6. Enviar notificación
      console.log("🔔 Enviando notificaciones...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Coordinador Actualizado",
        tipo: "coordinador_actualizado",
        contenido: `Se han actualizado los datos del coordinador ${coordinadorExistente.data[0].nombres} ${coordinadorExistente.data[0].apellidos}`,
        metadatos: {
          coordinador_id: id,
          coordinador_cedula: coordinadorExistente.data[0].cedula,
          campos_actualizados: Object.keys(datos),
          usuario_actualizador: user_action.id,
          fecha_actualizacion: new Date().toISOString(),
        },
        roles_ids: [7, 8, 9, 10],
        users_ids: [user_action.id, coordinadorExistente.data[0].cedula],
      });

      console.log("✅ Coordinador actualizado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Coordinador actualizado exitosamente",
          coordinador_id: id,
        },
        "Coordinador actualizado exitosamente",
        {
          status: 200,
          title: "Coordinador Actualizado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio actualizar coordinador:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method eliminarCoordinador
   * @description Elimina un coordinador (destitución)
   * @param {number} id - ID del coordinador
   * @param {object} user_action - Usuario que realiza la acción
   * @param {object} dataDestitucion - Datos específicos de la destitución
   * @param {string} dataDestitucion.tipo_accion - Tipo de acción (DESTITUCION, RENUNCIA)
   * @param {string} dataDestitucion.razon - Razón de la destitución
   * @param {string} dataDestitucion.observaciones - Observaciones adicionales
   * @param {string} dataDestitucion.fecha_efectiva - Fecha efectiva de la destitución
   * @returns {Object} Resultado de la operación
   */
  static async eliminarCoordinador(id, user_action, dataDestitucion = {}) {
    try {
      console.log(
        `🔍 [eliminarCoordinador] Destituyendo coordinador datos: ${dataDestitucion}`
      );

      // 1. Validar ID del coordinador
      const idValidation = ValidationService.validateId(id, "coordinador");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de coordinador inválido"
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

      // 3. Validar datos de destitución
      const validacionDestitucion =
        ValidationService.validateDestitucion(dataDestitucion);
      if (!validacionDestitucion.isValid) {
        console.error(
          "❌ Validación de datos de destitución fallida:",
          validacionDestitucion.errors
        );
        return FormatterResponseService.validationError(
          validacionDestitucion.errors,
          "Datos de destitución inválidos"
        );
      }

      // 4. Verificar que el coordinador existe
      const coordinadorExistente =
        await CoordinadorModel.obtenerCoordinadorPorId(id);

      if (FormatterResponseService.isError(coordinadorExistente)) {
        return coordinadorExistente;
      }

      if (
        !coordinadorExistente.data ||
        coordinadorExistente.data.length === 0
      ) {
        console.error("❌ Coordinador no encontrado:", id);
        return FormatterResponseService.notFound("Coordinador", id);
      }

      const coordinador = coordinadorExistente.data[0];

      // 5. Verificar que el coordinador está activo
      if (coordinador.estatus_coordinador !== "activo") {
        console.error("❌ Coordinador ya está inactivo:", id);
        return FormatterResponseService.validationError(
          ["El coordinador ya se encuentra inactivo en el sistema"],
          "No se puede destituir un coordinador inactivo"
        );
      }

      // 6. Destituir coordinador en el modelo
      console.log("🗑️ Destituyendo coordinador en base de datos...");
      const respuestaModel = await CoordinadorModel.destituirCoordinador(
        id,
        user_action.id,
        dataDestitucion.tipo_accion || "DESTITUCION",
        dataDestitucion.razon,
        dataDestitucion.observaciones,
        dataDestitucion.fecha_efectiva
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      // 7. Enviar notificación
      console.log("🔔 Enviando notificaciones...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Coordinador Destituido",
        tipo: "coordinador_destituido",
        contenido: `Se ha destituido al coordinador ${coordinador.nombres} ${coordinador.apellidos} del PNF ${coordinador.nombre_pnf}. Razón: ${dataDestitucion.razon}`,
        metadatos: {
          coordinador_id: id,
          coordinador_cedula: coordinador.cedula,
          coordinador_nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
          pnf_id: coordinador.id_pnf,
          pnf_nombre: coordinador.nombre_pnf,
          tipo_accion: dataDestitucion.tipo_accion || "DESTITUCION",
          razon: dataDestitucion.razon,
          fecha_efectiva:
            dataDestitucion.fecha_efectiva ||
            new Date().toISOString().split("T")[0],
          usuario_ejecutor: user_action.id,
          fecha_destitucion: new Date().toISOString(),
        },
        roles_ids: [7, 8, 9, 10], // Ajustar según los roles que necesiten notificación
        users_ids: [user_action.id, coordinador.cedula],
      });

      console.log("✅ Coordinador destituido exitosamente");

      return FormatterResponseService.success(
        {
          message: "Coordinador destituido exitosamente",
          coordinador: {
            id: id,
            cedula: coordinador.cedula,
            nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
            pnf: coordinador.nombre_pnf,
            tipo_accion: dataDestitucion.tipo_accion || "DESTITUCION",
            fecha_efectiva:
              dataDestitucion.fecha_efectiva ||
              new Date().toISOString().split("T")[0],
            estatus: "destituido",
          },
        },
        "Coordinador destituido exitosamente",
        {
          status: 200,
          title: "Coordinador Destituido",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio eliminar coordinador:", error);
      throw error;
    }
  }
  /**
   * @static
   * @async
   * @method restituirCoordinador
   * @description Restituye (reingresa) un coordinador destituido
   * @param {object} user_action - Usuario que realiza la acción
   * @param {object} dataRestitucion - Datos específicos de la restitución
   * @param {string} dataRestitucion.tipo_reingreso - Tipo de reingreso (REINGRESO, REINCORPORACION, REINTEGRO)
   * @param {string} dataRestitucion.motivo_reingreso - Motivo del reingreso
   * @param {string} dataRestitucion.observaciones - Observaciones adicionales
   * @param {string} dataRestitucion.fecha_efectiva - Fecha efectiva del reingreso
   * @param {number} dataRestitucion.registro_anterior_id - ID del registro de destitución anterior
   * @param {number} dataRestitucion.id_pnf - ID del PNF al que se reasigna
   * @returns {Object} Resultado de la operación
   */
  static async restituirCoordinador(user_action, dataRestitucion = {}) {
    try {
      console.log(
        `🔍 [restituirCoordinador] Restituyendo coordinador`, dataRestitucion 
      );

      const id = dataRestitucion.id_usuario;

      // 1. Validar ID de usuario
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

      // 2. Validar datos de restitución
      const validacionRestitucion =
        ValidationService.validateReingreso({...dataRestitucion, id_reingreso: dataRestitucion.id_usuario});
      if (!validacionRestitucion.isValid) {
        console.error(
          "❌ Validación de datos de restitución fallida:",
          validacionRestitucion.errors
        );
        return FormatterResponseService.validationError(
          validacionRestitucion.errors,
          "Datos de restitución inválidos"
        );
      }

      // 6. Restituir coordinador en el modelo
      console.log("🔄 Restituyendo coordinador en base de datos...");
      const respuestaModel = await CoordinadorModel.restituirCoordinador(
        id,
        user_action.id,
        dataRestitucion.tipo_reingreso || "REINGRESO",
        dataRestitucion.motivo_reingreso,
        dataRestitucion.observaciones,
        dataRestitucion.fecha_efectiva,
        dataRestitucion.registro_anterior_id,
        dataRestitucion.id_pnf
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      // 7. Enviar notificación
      console.log("🔔 Enviando notificaciones...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Coordinador Restituido",
        tipo: "coordinador_restituido",
        contenido: `Se ha restituido al coordinador ${coordinador.nombres} ${
          coordinador.apellidos
        } en el PNF ${
          dataRestitucion.id_pnf ? "nuevo PNF" : coordinador.nombre_pnf
        }. Motivo: ${dataRestitucion.motivo_reingreso}`,
        metadatos: {
          coordinador_id: id,
          coordinador_cedula: coordinador.cedula,
          coordinador_nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
          pnf_id: dataRestitucion.id_pnf || coordinador.id_pnf,
          pnf_nombre: dataRestitucion.id_pnf
            ? "Nuevo PNF"
            : coordinador.nombre_pnf,
          tipo_reingreso: dataRestitucion.tipo_reingreso || "REINGRESO",
          motivo_reingreso: dataRestitucion.motivo_reingreso,
          fecha_efectiva:
            dataRestitucion.fecha_efectiva ||
            new Date().toISOString().split("T")[0],
          usuario_ejecutor: user_action.id,
          fecha_restitucion: new Date().toISOString(),
        },
        roles_ids: [7, 8, 9, 10],
        users_ids: [user_action.id, coordinador.cedula],
      });

      console.log("✅ Coordinador restituido exitosamente");

      return FormatterResponseService.success(
        {
          message: "Coordinador restituido exitosamente",
          coordinador: {
            id: id,
            cedula: coordinador.cedula,
            nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
            pnf: dataRestitucion.id_pnf ? "Nuevo PNF" : coordinador.nombre_pnf,
            tipo_reingreso: dataRestitucion.tipo_reingreso || "REINGRESO",
            fecha_efectiva:
              dataRestitucion.fecha_efectiva ||
              new Date().toISOString().split("T")[0],
            estatus: "activo",
          },
        },
        "Coordinador restituido exitosamente",
        {
          status: 200,
          title: "Coordinador Restituido",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio restituir coordinador:", error);
      throw error;
    }
  }
  /**
   * @static
   * @async
   * @method obtenerHistorialDestituciones
   * @description Obtiene el historial de destituciones de un coordinador
   * @param {number} id - ID del coordinador
   * @param {object} user_action - Usuario que realiza la consulta
   * @returns {Object} Resultado de la operación
   */
  static async obtenerHistorialDestituciones(id, user_action) {
    try {
      console.log(
        `🔍 [obtenerHistorialDestituciones] Consultando historial del coordinador ID: ${id}`
      );

      // 1. Validar ID del coordinador
      const idValidation = ValidationService.validateId(id, "coordinador");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de coordinador inválido"
        );
      }

      // 3. Verificar que el coordinador existe
      const coordinadorExistente =
        await CoordinadorModel.obtenerCoordinadorPorId(id);

      if (FormatterResponseService.isError(coordinadorExistente)) {
        return coordinadorExistente;
      }

      if (
        !coordinadorExistente.data ||
        coordinadorExistente.data.length === 0
      ) {
        console.error("❌ Coordinador no encontrado:", id);
        return FormatterResponseService.notFound("Coordinador", id);
      }

      const coordinador = coordinadorExistente.data[0];

      // 4. Verificar permisos de acceso (si el usuario es coordinador, solo puede ver su propio historial)
      if (
        user_action.rol === "Coordinador" &&
        user_action.id_coordinador !== parseInt(id)
      ) {
        console.error("❌ Intento de acceso no autorizado al historial:", {
          usuario: user_action.id,
          coordinador_solicitado: id,
          coordinador_usuario: user_action.id_coordinador,
        });
        return FormatterResponseService.unauthorized(
          "No tienes permisos para ver el historial de otro coordinador"
        );
      }

      // 5. Obtener historial de destituciones desde el modelo
      console.log("📋 Obteniendo historial de destituciones...");
      const respuestaModel =
        await CoordinadorModel.obtenerHistorialDestituciones(id);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo:", respuestaModel);
        return respuestaModel;
      }

      const historial = respuestaModel.data || [];

      console.log(
        `✅ Historial obtenido exitosamente. Registros encontrados: ${historial.length}`
      );

      // 6. Registrar auditoría de la consulta
      const auditService = new AuditService();
      await auditService.registrarAuditoria({
        accion: "CONSULTA_HISTORIAL_DESTITUCIONES",
        usuario_id: user_action.id,
        recurso_afectado: "coordinador",
        recurso_id: id,
        detalles: {
          coordinador_nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
          coordinador_cedula: coordinador.cedula,
          registros_encontrados: historial.length,
          pnf: coordinador.nombre_pnf,
        },
        ip: user_action.ip || "N/A",
        user_agent: user_action.user_agent || "N/A",
      });

      return FormatterResponseService.success(
        {
          historial: historial,
          coordinador: {
            id: id,
            cedula: coordinador.cedula,
            nombre: `${coordinador.nombres} ${coordinador.apellidos}`,
            pnf: coordinador.nombre_pnf,
            total_registros: historial.length,
          },
          metadata: {
            total_registros: historial.length,
            coordinador_id: id,
            fecha_consulta: new Date().toISOString(),
          },
        },
        "Historial de destituciones obtenido correctamente",
        {
          status: 200,
          title: "Historial Obtenido",
        }
      );
    } catch (error) {
      console.error(
        "💥 Error en servicio obtener historial destituciones:",
        error
      );
      throw error;
    }
  }
}
