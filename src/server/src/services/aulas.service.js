import ValidationService from "./validation.service.js";
import NotificationService from "./notification.service.js";
import AulaModel from "../models/aulas.model.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import { loadEnv } from "../utils/utilis.js";

loadEnv();

/**
 * @class AulaService
 * @description Servicio para operaciones de negocio relacionadas con aulas
 */
export default class AulaService {
  /**
   * @static
   * @async
   * @method registrarAula
   * @description Registrar una nueva aula con validación y notificación
   * @param {Object} datos - Datos del aula a registrar
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async registrarAula(datos, user_action) {
    try {
      console.log("🔍 [registrarAula] Iniciando registro de aula...");
      console.log("🏷️ Datos del aula a registrar:", datos);
      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar datos del aula
      console.log("✅ Validando datos del aula...");
      const validation = ValidationService.validateAula(datos);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en registro de aula"
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
      // 4. Crear aula en el modelo
      console.log("🏫 Creando aula en base de datos...");
      const respuestaModel = await AulaModel.crear(datos, user_action.id);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📊 Respuesta del modelo:", respuestaModel);
      }

      // 5. Enviar notificación específica para gestión de infraestructura
      console.log("🔔 Enviando notificaciones de aula...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Nueva Aula Registrada",
        tipo: "aula_creada",
        contenido: `Se ha registrado el aula "${datos.nombre}" (Código: ${datos.codigo}) en la sede ${datos.sede}`,
        metadatos: {
          aula_codigo: datos.codigo,
          aula_nombre: datos.nombre,
          aula_tipo: datos.tipo,
          aula_capacidad: datos.capacidad,
          aula_sede: datos.sede,
          equipamiento: datos.equipamiento,
          usuario_creador: user_action.id,
          fecha_registro: new Date().toISOString(),
          url_action: `/infraestructura/aulas`,
        },
        roles_ids: [2, 7, 8, 9, 10, 20], // Coordinador, Directores, Vicerrectoría, SuperAdmin
        users_ids: [user_action.id], // Usuario que creó el aula
      });

      console.log("🎉 Aula registrada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Aula creada exitosamente",
          aula: {
            id: respuestaModel.data?.id_aula || datos.codigo,
            codigo: datos.codigo,
            nombre: datos.nombre,
            tipo: datos.tipo,
            capacidad: datos.capacidad,
            sede: datos.sede,
            equipamiento: datos.equipamiento,
          },
        },
        "Aula registrada exitosamente",
        {
          status: 201,
          title: "Aula Creada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio registrar aula:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarAulas
   * @description Obtener todas las aulas con validación de parámetros
   * @param {Object} queryParams - Parámetros de consulta (opcional)
   * @returns {Object} Resultado de la operación
   */
  static async mostrarAulas(queryParams = {}) {
    try {
      console.log("🔍 [mostrarAulas] Obteniendo todas las aulas...");

      // Validar parámetros de consulta
      const allowedParams = ["page", "limit", "sort", "order", "sede", "tipo"];
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

      const respuestaModel = await AulaModel.obtenerTodas(queryParams);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          aulas: respuestaModel.data,
          total: respuestaModel.data.length,
          page: parseInt(queryParams.page) || 1,
          limit: parseInt(queryParams.limit) || respuestaModel.data.length,
        },
        "Aulas obtenidas exitosamente",
        {
          status: 200,
          title: "Lista de Aulas",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar aulas:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAulaPorId
   * @description Obtener una aula específica por ID con validación
   * @param {number} id_aula - ID del aula a buscar
   * @returns {Object} Resultado de la operación
   */
  static async obtenerAulaPorId(id_aula) {
    try {
      console.log(`🔍 [obtenerAulaPorId] Buscando aula ID: ${id_aula}`);

      // Validar ID del aula
      const idValidation = ValidationService.validateId(id_aula, "aula");
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de aula inválido"
        );
      }

      const respuestaModel = await AulaModel.buscarPorId(id_aula);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      if (!respuestaModel.data || respuestaModel.data.length === 0) {
        return FormatterResponseService.notFound("Aula", id_aula);
      }

      const aula = respuestaModel.data[0];

      console.log(`✅ Aula encontrada: ${aula.nombre}`);

      return FormatterResponseService.success(
        {
          aula: aula,
        },
        "Aula obtenida exitosamente",
        {
          status: 200,
          title: "Detalles del Aula",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener aula por ID:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizarAula
   * @description Actualizar una aula existente con validación y notificación
   * @param {number} id_aula - ID del aula a actualizar
   * @param {Object} datos - Datos actualizados del aula
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async actualizarAula(id_aula, datos, user_action) {
    try {
      console.log(`🔍 [actualizarAula] Actualizando aula ID: ${id_aula}`);

      // Validar ID del aula
      const idValidation = ValidationService.validateId(id_aula, "aula");
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de aula inválido"
        );
      }

      // Validar datos parciales del aula
      const validation = ValidationService.validatePartialAula(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en actualización de aula"
        );
      }

      // Validar ID de usuario
      const userValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Verificar que el aula existe
      const aulaExistente = await AulaModel.buscarPorId(id_aula);
      if (
        FormatterResponseService.isError(aulaExistente) ||
        !aulaExistente.data ||
        aulaExistente.data.length === 0
      ) {
        return FormatterResponseService.notFound("Aula", id_aula);
      }

      const aulaActual = aulaExistente.data[0];

      // Verificar duplicados si se está actualizando código o nombre
      if (datos.codigo || datos.nombre) {
        const aulasExistentes = await AulaModel.obtenerTodas();
        const aulaDuplicada = aulasExistentes.data.find(
          (aula) =>
            aula.id_aula !== id_aula &&
            (aula.codigo === (datos.codigo || aulaActual.codigo) ||
              aula.nombre === (datos.nombre || aulaActual.nombre))
        );

        if (aulaDuplicada) {
          return FormatterResponseService.error(
            "Aula ya existe",
            "Ya existe otro aula con el mismo código o nombre",
            409,
            "AULA_DUPLICADA",
            {
              aula_existente: {
                id: aulaDuplicada.id_aula,
                codigo: aulaDuplicada.codigo,
                nombre: aulaDuplicada.nombre,
              },
            }
          );
        }
      }

      // Actualizar aula
      const respuestaModel = await AulaModel.actualizar(
        id_aula,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Enviar notificación específica para gestión de infraestructura
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Aula Actualizada",
        tipo: "aula_actualizada",
        contenido: `Se han actualizado los datos del aula "${
          datos.nombre || aulaActual.nombre
        }" (${datos.codigo || aulaActual.codigo}) en la sede ${
          datos.sede || aulaActual.sede
        }`,
        metadatos: {
          aula_id: id_aula,
          aula_codigo: datos.codigo || aulaActual.codigo,
          aula_nombre: datos.nombre || aulaActual.nombre,
          aula_sede: datos.sede || aulaActual.sede,
          campos_actualizados: Object.keys(datos),
          usuario_actualizador: user_action.id,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/infraestructura/aulas/${id_aula}`,
        },
        roles_ids: [2, 7, 8, 9, 10, 20], // Coordinador, Directores, Vicerrectoría, SuperAdmin
        users_ids: [user_action.id], // Usuario que actualizó el aula
      });

      console.log("✅ Aula actualizada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Aula actualizada exitosamente",
          aula_id: id_aula,
          cambios: Object.keys(datos),
        },
        "Aula actualizada exitosamente",
        {
          status: 200,
          title: "Aula Actualizada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio actualizar aula:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method eliminarAula
   * @description Eliminar una aula con validación y notificación
   * @param {number} id_aula - ID del aula a eliminar
   * @param {object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async eliminarAula(id_aula, user_action) {
    try {
      console.log(`🔍 [eliminarAula] Eliminando aula ID: ${id_aula}`);

      // Validar ID del aula
      const idValidation = ValidationService.validateId(id_aula, "aula");
      if (!idValidation.isValid) {
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de aula inválido"
        );
      }

      // Validar ID de usuario
      const userValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Verificar que el aula existe
      const aulaExistente = await AulaModel.buscarPorId(id_aula);
      if (
        FormatterResponseService.isError(aulaExistente) ||
        !aulaExistente.data ||
        aulaExistente.data.length === 0
      ) {
        return FormatterResponseService.notFound("Aula", id_aula);
      }

      const aula = aulaExistente.data[0];

      // Verificar si el aula está siendo utilizada en horarios futuros
      const tieneHorariosFuturos = await AulaModel.verificarHorariosFuturos(
        id_aula
      );
      if (tieneHorariosFuturos) {
        return FormatterResponseService.error(
          "Aula en uso",
          "No se puede eliminar el aula porque tiene horarios asignados en el futuro",
          409,
          "AULA_EN_USO",
          {
            aula_id: id_aula,
            aula_nombre: aula.nombre,
            accion_recomendada: "Reasignar o cancelar los horarios primero",
          }
        );
      }

      // Eliminar aula
      const respuestaModel = await AulaModel.eliminar(id_aula, user_action.id);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Enviar notificación específica para gestión de infraestructura
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Aula Eliminada",
        tipo: "aula_eliminada",
        contenido: `Se ha eliminado el aula "${aula.nombre}" (${aula.codigo}) de la sede ${aula.sede} del sistema`,
        metadatos: {
          aula_id: id_aula,
          aula_codigo: aula.codigo,
          aula_nombre: aula.nombre,
          aula_sede: aula.sede,
          aula_tipo: aula.tipo,
          usuario_ejecutor: user_action.id,
          fecha_eliminacion: new Date().toISOString(),
          url_action: `/infraestructura/aulas`,
        },
        roles_ids: [2, 7, 8, 9, 10, 20], // Coordinador, Directores, Vicerrectoría, SuperAdmin
        users_ids: [user_action.id], // Usuario que eliminó el aula
      });

      console.log("✅ Aula eliminada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Aula eliminada exitosamente",
          aula: {
            id: id_aula,
            codigo: aula.codigo,
            nombre: aula.nombre,
          },
        },
        "Aula eliminada exitosamente",
        {
          status: 200,
          title: "Aula Eliminada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio eliminar aula:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAulasPorTipo
   * @description Obtener aulas filtradas por tipo con validación
   * @param {string} tipo - Tipo de aula a filtrar
   * @returns {Object} Resultado de la operación
   */
  static async obtenerAulasPorTipo(tipo) {
    try {
      console.log(`🔍 [obtenerAulasPorTipo] Filtrando aulas por tipo: ${tipo}`);

      // Validar tipo de aula
      if (!tipo || typeof tipo !== "string" || tipo.trim().length === 0) {
        return FormatterResponseService.validationError(
          [
            {
              path: "tipo",
              message:
                "El tipo de aula es requerido y debe ser una cadena no vacía",
            },
          ],
          "Error de validación en filtro por tipo"
        );
      }

      const tipoLimpio = tipo.trim().toUpperCase();

      // Validar que el tipo sea válido
      const tiposValidos = [
        "TEORIA",
        "LABORATORIO",
        "MIXTA",
        "AUDITORIO",
        "TALLER",
      ];
      if (!tiposValidos.includes(tipoLimpio)) {
        return FormatterResponseService.validationError(
          [
            {
              path: "tipo",
              message: `Tipo de aula inválido. Los tipos válidos son: ${tiposValidos.join(
                ", "
              )}`,
            },
          ],
          "Tipo de aula no válido"
        );
      }

      const respuestaModel = await AulaModel.filtrarPorTipo(tipoLimpio);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          aulas: respuestaModel.data,
          total: respuestaModel.data.length,
          tipo: tipoLimpio,
        },
        `Aulas de tipo ${tipoLimpio} obtenidas exitosamente`,
        {
          status: 200,
          title: `Aulas - ${tipoLimpio}`,
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener aulas por tipo:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAulasPorSede
   * @description Obtener aulas filtradas por sede con validación, paginación, ordenamiento y búsqueda
   * @param {Object} queryParams - Parámetros de consulta
   * @param {string} queryParams.page - Página actual
   * @param {string} queryParams.limit - Límite por página
   * @param {string} queryParams.sort_order - Campo para ordenar
   * @param {string} queryParams.search - Término de búsqueda
   * @param {string} sede - ID de la sede a filtrar
   * @returns {Object} Resultado de la operación
   */
  static async obtenerAulasPorSede(queryParams, sede) {
    try {
      const queryParamsValidas = ["page", "limit", "sort_order", "search"];
      const validationQuery = ValidationService.validateQueryParams(
        queryParams,
        queryParamsValidas
      );

      console.log(
        `🔍 [obtenerAulasPorSede] Filtrando aulas por sede: ${sede}`,
        queryParams
      );

      const respuestaModel = await AulaModel.filtrarPorSede(sede, queryParams);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        respuestaModel.data,
        `Aulas de la sede ${sede} obtenidas exitosamente`,
        {
          status: 200,
          title: `Aulas - Sede ${sede}`,
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener aulas por sede:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAulasDisponibles
   * @description Obtener aulas disponibles para un horario específico
   * @param {Object} filtros - Filtros de disponibilidad
   * @param {string} filtros.fecha - Fecha en formato YYYY-MM-DD
   * @param {string} filtros.hora_inicio - Hora de inicio en formato HH:MM
   * @param {string} filtros.hora_fin - Hora de fin en formato HH:MM
   * @param {string} filtros.tipo - Tipo de aula (opcional)
   * @param {string} filtros.sede - Sede (opcional)
   * @returns {Object} Resultado de la operación
   */
  static async obtenerAulasDisponibles(filtros = {}) {
    try {
      console.log("🔍 [obtenerAulasDisponibles] Buscando aulas disponibles...");

      // Validar filtros de disponibilidad
      const validation = ValidationService.validateDisponibilidadAula(filtros);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en filtros de disponibilidad"
        );
      }

      const respuestaModel = await AulaModel.obtenerDisponibles(filtros);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          aulas_disponibles: respuestaModel.data,
          total: respuestaModel.data.length,
          filtros: filtros,
        },
        "Aulas disponibles obtenidas exitosamente",
        {
          status: 200,
          title: "Aulas Disponibles",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener aulas disponibles:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAulasPorPnf
   * @description Obtener aulas disponibles para un horario específico
   * @param {number} codigoPNF - de disponibilidad
   * @returns {Object} Resultado de la operación
   */
  static async obtenerAulasPorPnf(codigoPNF) {
    try {
      console.log("🔍 [obtenerAulasPorPnf] Buscando aulas disponibles...");

      const respuestaModel = await AulaModel.obtenerAulasPorPnf(codigoPNF);

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      return FormatterResponseService.success(
        {
          aulas_disponibles: respuestaModel.data,
          total: respuestaModel.data.length,
          filtros: filtros,
        },
        "Aulas disponibles obtenidas exitosamente",
        {
          status: 200,
          title: "Aulas Disponibles",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener aulas disponibles:", error);
      throw error;
    }
  }
}
