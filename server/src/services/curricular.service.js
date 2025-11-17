import ValidationService from "./validation.service.js";
import CurricularModel from "../models/curricular.model.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import NotificationService from "./notification.service.js";

/**
 * @class CurricularService
 * @description Servicio para operaciones de negocio relacionadas con:
 * - Programas Nacionales de Formación (PNF)
 * - Unidades Curriculares
 * - Trayectos académicos
 * - Secciones
 */
export default class CurricularService {
  /**
   * @static
   * @async
   * @method registrarPNF
   * @description Registrar un nuevo Programa Nacional de Formación (PNF)
   * @param {Object} datos - Datos del PNF
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async registrarPNF(datos, user_action) {
    try {
      console.log("🔍 [registrarPNF] Iniciando registro de PNF...");

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar datos del PNF
      console.log("✅ Validando datos del PNF...");
      const validation = ValidationService.validatePnf(datos);

      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en registro de PNF"
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

      // 3. Crear PNF en el modelo
      console.log("🎓 Creando PNF en base de datos...");
      const respuestaModel = await CurricularModel.registrarPNF(
        datos,
        user_action.id
      );

      // Verificar si la respuesta del modelo indica error
      if (respuestaModel.state === "error" || respuestaModel.status >= 400) {
        console.error("❌ Error en modelo crear PNF:", respuestaModel);

        return FormatterResponseService.error(
          respuestaModel.title || "Error en base de datos",
          respuestaModel.message || "Error al crear el PNF",
          respuestaModel.status || 500,
          respuestaModel.code || "DB_ERROR",
          {
            originalError:
              process.env.MODE === "DEVELOPMENT" ? respuestaModel : undefined,
          }
        );
      }

      // 4. Enviar notificación GLOBAL (PNF es información institucional importante)
      console.log("🔔 Enviando notificación GLOBAL de PNF...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Nuevo Programa Nacional de Formación (PNF)",
        tipo: "pnf_creado",
        contenido: `Se ha registrado el nuevo PNF "${datos.nombrePNF}" (Código: ${datos.codigoPNF}) en el sistema académico`,
        metadatos: {
          pnf_nombre: datos.nombrePNF,
          pnf_codigo: datos.codigoPNF,
          pnf_descripcion: datos.descripcionPNF,
          usuario_creador: user_action.id,
          fecha_registro: new Date().toISOString(),
          url_action: `/academico/pnf`,
        },
        // NO se pasan roles_ids ni users_ids → Notificación global para todos
      });

      console.log("🎉 PNF registrado exitosamente");

      return FormatterResponseService.success(
        {
          message: "PNF creado exitosamente",
          pnf: {
            id: respuestaModel.data?.id_pnf || respuestaModel.data?.id,
            nombre: datos.nombrePNF,
            codigo: datos.codigoPNF,
            descripcion: datos.descripcionPNF,
            estado: "activo",
          },
        },
        "PNF registrado exitosamente",
        {
          status: 201,
          title: "PNF Creado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio registrar PNF:", error);

      // Si es un error conocido del modelo, convertirlo a respuesta del servicio
      if (error.state === "error" || error.status >= 400) {
        return FormatterResponseService.error(
          error.title || "Error en base de datos",
          error.message || "Error al crear el PNF",
          error.status || 500,
          error.code || "DB_ERROR",
          {
            originalError:
              process.env.MODE === "DEVELOPMENT" ? error : undefined,
          }
        );
      }

      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method registrarUnidadCurricular
   * @description Registrar una nueva Unidad Curricular
   * @param {number} idTrayecto - ID del trayecto
   * @param {Object} datos - Datos de la unidad curricular
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async registrarUnidadCurricular(idTrayecto, datos, user_action) {
    try {
      console.log(
        "🔍 [registrarUnidadCurricular] Iniciando registro de unidad curricular..."
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          datos: JSON.stringify(datos, null, 2),
          idTrayecto: idTrayecto,
          user_action: user_action,
        });
      }

      // 1. Validar datos de la unidad curricular
      console.log("✅ Validando datos de la unidad curricular...");
      const validation = ValidationService.validateUnidadCurricular(datos);

      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en registro de unidad curricular"
        );
      }

      // 2. Validar ID de usuario
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

      // 2. Validar ID de trayecto
      const idTrayectoValidation = ValidationService.validateId(
        idTrayecto,
        "id del trayecto"
      );

      if (!idTrayectoValidation.isValid) {
        console.error(
          "❌ Validación de ID fallida:",
          idTrayectoValidation.errors
        );
        return FormatterResponseService.validationError(
          idTrayectoValidation.errors,
          "ID de trayecto inválido"
        );
      }

      // 3. Crear unidad curricular en el modelo
      console.log("📚 Creando unidad curricular en base de datos...");
      const respuestaModel = await CurricularModel.registrarUnidadCurricular(
        idTrayecto,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error(
          "❌ Error en modelo crear unidad curricular:",
          respuestaModel
        );
        return respuestaModel;
      }

      // 4. Enviar notificación específica para coordinación académica
      console.log("🔔 Enviando notificaciones de unidad curricular...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Nueva Unidad Curricular Registrada",
        tipo: "unidad_curricular_creada",
        contenido: `Se ha registrado la unidad curricular "${datos.nombreUnidadCurricular}" (Código: ${datos.codigoUnidadCurricular}) en el sistema`,
        metadatos: {
          unidad_curricular_nombre: datos.nombreUnidadCurricular,
          unidad_curricular_codigo: datos.codigoUnidadCurricular,
          trayecto_id: idTrayecto,
          creditos: datos.creditos,
          horas_academicas: datos.horasAcademicas,
          usuario_creador: user_action.id,
          fecha_registro: new Date().toISOString(),
          url_action: `/academico/unidades-curriculares`,
        },
        roles_ids: [2, 7, 8, 20], // Solo Coordinador, Directores y SuperAdmin
        users_ids: [user_action.id], // Usuario que creó la unidad curricular
      });

      console.log("🎉 Unidad curricular registrada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Unidad curricular creada exitosamente",
          unidad_curricular: {
            id:
              respuestaModel.data?.id_unidad_curricular ||
              respuestaModel.data?.id,
            nombre: datos.nombreUnidadCurricular,
            codigo: datos.codigoUnidadCurricular,
            trayecto_id: datos.idTrayecto,
            creditos: datos.creditos,
            horas: datos.horasAcademicas,
          },
        },
        "Unidad curricular registrada exitosamente",
        {
          status: 201,
          title: "Unidad Curricular Creada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio registrar unidad curricular:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarPNF
   * @description Obtener todos los Programas Nacionales de Formación registrados
   * @returns {Object} Resultado de la operación
   */
  static async mostrarPNF() {
    try {
      console.log("🔍 [mostrarPNF] Obteniendo listado de PNF...");

      const respuestaModel = await CurricularModel.mostrarPNF();

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo obtener PNF:", respuestaModel);
        return respuestaModel;
      }

      console.log(`✅ Se obtuvieron ${respuestaModel.data?.length || 0} PNF`);

      return FormatterResponseService.success(
        {
          pnf: respuestaModel.data,
          total: respuestaModel.data?.length || 0,
        },
        "PNF obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de PNF",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar PNF:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarTrayectos
   * @description Obtener todos los trayectos académicos registrados ordenados específicamente
   * @param {string} codigoPNF - Filtro por PNF (opcional)
   * @returns {Object} Resultado de la operación
   */
  static async mostrarTrayectos(codigoPNF = null) {
    try {
      console.log("🔍 [mostrarTrayectos] Obteniendo listado de trayectos...", {
        pnf_filtro: codigoPNF,
      });

      const respuestaModel = await CurricularModel.mostrarTrayectos(codigoPNF);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo obtener trayectos:", respuestaModel);
        return respuestaModel;
      }

      // 🔥 ORDENAR LOS TRAYECTOS EN EL ORDEN ESPECÍFICO
      const ordenEspecifico = ["INICIAL", "1", "2", "3", "4", "5", "6"];

      const trayectosOrdenados =
        respuestaModel.data?.sort((a, b) => {
          const indexA = ordenEspecifico.indexOf(a.valor_trayecto?.toString());
          const indexB = ordenEspecifico.indexOf(b.valor_trayecto?.toString());

          // Si ambos están en la lista de orden, usar el orden definido
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }

          // Si solo A está en la lista, A va primero
          if (indexA !== -1) return -1;

          // Si solo B está en la lista, B va primero
          if (indexB !== -1) return 1;

          // Si ninguno está en la lista, orden alfabético normal
          return (a.valor_trayecto || "")
            .toString()
            .localeCompare((b.valor_trayecto || "").toString());
        }) || [];

      console.log(
        `✅ Se obtuvieron ${trayectosOrdenados.length} trayectos ordenados`
      );

      return FormatterResponseService.success(
        {
          trayectos: trayectosOrdenados,
          total: trayectosOrdenados.length,
          ...(codigoPNF && { codigoPNF_filtrado: codigoPNF }),
        },
        "Trayectos obtenidos exitosamente",
        {
          status: 200,
          title: "Lista de Trayectos",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar trayectos:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarUnidadesCurriculares
   * @description Obtener todas las unidades curriculares de un trayecto
   * @param {number} trayecto - ID del trayecto (opcional)
   * @returns {Object} Resultado de la operación
   */
  static async mostrarUnidadesCurriculares(trayecto = null) {
    try {
      console.log(
        "🔍 [mostrarUnidadesCurriculares] Obteniendo unidades curriculares...",
        {
          trayecto_filtro: trayecto,
        }
      );

      // Validar trayecto si se proporciona
      if (trayecto !== null) {
        const trayectoValidation = ValidationService.validateId(
          trayecto,
          "trayecto"
        );
        if (!trayectoValidation.isValid) {
          console.error(
            "❌ Validación de trayecto fallida:",
            trayectoValidation.errors
          );
          return FormatterResponseService.validationError(
            trayectoValidation.errors,
            "ID de trayecto inválido"
          );
        }
      }

      const respuestaModel = await CurricularModel.mostrarUnidadesCurriculares(
        trayecto
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error(
          "❌ Error en modelo obtener unidades curriculares:",
          respuestaModel
        );
        return respuestaModel;
      }

      console.log(
        `✅ Se obtuvieron ${
          respuestaModel.data?.length || 0
        } unidades curriculares`
      );

      return FormatterResponseService.success(
        {
          unidades_curriculares: respuestaModel.data,
          total: respuestaModel.data?.length || 0,
          ...(trayecto && { trayecto_filtrado: trayecto }),
        },
        "Unidades curriculares obtenidas exitosamente",
        {
          status: 200,
          title: "Lista de Unidades Curriculares",
        }
      );
    } catch (error) {
      console.error(
        "💥 Error en servicio mostrar unidades curriculares:",
        error
      );
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarSecciones
   * @description Obtener todas las secciones de un trayecto
   * @param {number} trayecto - ID del trayecto (opcional)
   * @returns {Object} Resultado de la operación
   */
  static async mostrarSecciones(trayecto = null) {
    try {
      console.log("🔍 [mostrarSecciones] Obteniendo secciones...", {
        trayecto_filtro: trayecto,
      });

      // Validar trayecto si se proporciona
      if (trayecto !== null) {
        const trayectoValidation = ValidationService.validateId(
          trayecto,
          "trayecto"
        );
        if (!trayectoValidation.isValid) {
          console.error(
            "❌ Validación de trayecto fallida:",
            trayectoValidation.errors
          );
          return FormatterResponseService.validationError(
            trayectoValidation.errors,
            "ID de trayecto inválido"
          );
        }
      }

      const respuestaModel = await CurricularModel.mostrarSecciones(trayecto);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo obtener secciones:", respuestaModel);
        return respuestaModel;
      }

      console.log(
        `✅ Se obtuvieron ${respuestaModel.data?.length || 0} secciones`
      );

      return FormatterResponseService.success(
        {
          secciones: respuestaModel.data,
          total: respuestaModel.data?.length || 0,
          ...(trayecto && { trayecto_filtrado: trayecto }),
        },
        "Secciones obtenidas exitosamente",
        {
          status: 200,
          title: "Lista de Secciones",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar secciones:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarSeccionesByPnfAndValueTrayecto
   * @description Obtener todas las secciones de un trayecto específico de un PNF
   * @param {string} codigoPNF - Código del PNF
   * @param {string|number} valorTrayecto - Valor del trayecto
   * @returns {Object} Resultado de la operación
   */
  static async mostrarSeccionesByPnfAndValueTrayecto(codigoPNF, valorTrayecto) {
    try {
      console.log("🔍 [Servicio] Obteniendo secciones...", {
        codigoPNF,
        valorTrayecto,
      });

      // Validar parámetros
      if (!codigoPNF || !valorTrayecto) {
        return FormatterResponseService.error(
          "Los parámetros codigoPNF y valorTrayecto son requeridos",
          {
            status: 400,
            title: "Parámetros inválidos",
          }
        );
      }

      const respuestaModel =
        await CurricularModel.mostrarSeccionesByPnfAndValueTrayecto(
          codigoPNF,
          valorTrayecto
        );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo obtener secciones:", respuestaModel);
        return respuestaModel;
      }

      console.log(
        `✅ Se obtuvieron ${respuestaModel.data?.length || 0} secciones`
      );

      return FormatterResponseService.success(
        {
          secciones: respuestaModel.data,
          total: respuestaModel.data?.length || 0,
          codigoPNF,
          valorTrayecto,
        },
        "Secciones obtenidas exitosamente",
        {
          status: 200,
          title: "Lista de Secciones",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar secciones:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method mostrarSeccionesByPnfAndValueUnidadCurricular
   * @description Obtener todas las unidades curriculares de un trayecto específico de un PNF
   * @param {string} codigoPNF - Código del PNF
   * @param {string|number} valorTrayecto - Valor del trayecto
   * @returns {Object} Resultado de la operación
   */
  static async mostrarSeccionesByPnfAndValueUnidadCurricular(
    codigoPNF,
    valorTrayecto
  ) {
    try {
      console.log("🔍 [Servicio] Obteniendo unidades...", {
        codigoPNF,
        valorTrayecto,
      });

      // Validar parámetros
      if (!codigoPNF || !valorTrayecto) {
        return FormatterResponseService.error(
          "Los parámetros codigoPNF y valorTrayecto son requeridos",
          {
            status: 400,
            title: "Parámetros inválidos",
          }
        );
      }

      const respuestaModel =
        await CurricularModel.mostrarSeccionesByPnfAndValueUnidadCurricular(
          codigoPNF,
          valorTrayecto
        );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo obtener unidades:", respuestaModel);
        return respuestaModel;
      }

      console.log(
        `✅ Se obtuvieron ${respuestaModel.data?.length || 0} unidades`
      );

      return FormatterResponseService.success(
        {
          unidades: respuestaModel.data,
          total: respuestaModel.data?.length || 0,
          codigoPNF,
          valorTrayecto,
        },
        "Secciones obtenidas exitosamente",
        {
          status: 200,
          title: "Lista de Secciones",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio mostrar unidades:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method crearSecciones
   * @description Crear secciones para un trayecto de forma automática
   * @param {number} idTrayecto - ID del trayecto
   * @param {Object} datos - Datos para la creación de secciones
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async crearSecciones(idTrayecto, datos, user_action) {
    try {
      console.log(
        "🔍 [crearSecciones] Creando secciones para trayecto:",
        idTrayecto
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          idTrayecto,
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar ID del trayecto
      const trayectoValidation = ValidationService.validateId(
        idTrayecto,
        "trayecto"
      );
      if (!trayectoValidation.isValid) {
        console.error(
          "❌ Validación de trayecto fallida:",
          trayectoValidation.errors
        );
        return FormatterResponseService.validationError(
          trayectoValidation.errors,
          "ID de trayecto inválido"
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

      // 3. Validar datos para creación de secciones
      const validation = ValidationService.validateCreacionSecciones(datos);
      if (!validation.isValid) {
        console.error("❌ Validación de datos fallida:", validation.errors);
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en creación de secciones"
        );
      }

      // 4. Crear secciones en el modelo
      console.log("📋 Creando secciones en base de datos...");
      const respuestaModel = await CurricularModel.CrearSecciones(
        idTrayecto,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo crear secciones:", respuestaModel);
        return respuestaModel;
      }

      // 5. Enviar notificación específica para coordinación académica
      console.log("🔔 Enviando notificaciones de creación de secciones...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Secciones Creadas para Trayecto",
        tipo: "secciones_creadas",
        contenido: `Se han creado ${datos.cantidadSecciones} secciones para el trayecto académico. Turno: ${datos.turno}`,
        metadatos: {
          trayecto_id: idTrayecto,
          cantidad_secciones: datos.cantidadSecciones,
          turno: datos.turno,
          usuario_creador: user_action.id,
          fecha_creacion: new Date().toISOString(),
          url_action: `/academico/secciones?trayecto=${idTrayecto}`,
        },
        roles_ids: [2, 7, 8, 20], // Solo Coordinador, Directores y SuperAdmin
        users_ids: [user_action.id], // Usuario que creó las secciones
      });

      console.log("🎉 Secciones creadas exitosamente");

      return FormatterResponseService.success(
        {
          message: "Secciones creadas exitosamente",
          trayecto_id: idTrayecto,
          secciones_creadas: respuestaModel.data || [],
          total_creadas: respuestaModel.data?.length || 0,
        },
        "Secciones creadas exitosamente",
        {
          status: 201,
          title: "Secciones Creadas",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio crear secciones:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method asignarTurnoSeccion
   * @description Asignar un turno a una sección específica
   * @param {number} idSeccion - Id de la seccion
   * @param {Object} datos - Datos para la asignación de turno
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async asignarTurnoSeccion(idSeccion, datos, user_action) {
    try {
      console.log("🔍 [asignarTurnoSeccion] Asignando turno a sección...");

      // 1. Validar ID de usuario
      const turnoValidation = ValidationService.validateId(
        parseInt(datos.idTurno),
        "Id de Turno"
      );
      if (!turnoValidation.isValid) {
        console.error(
          "❌ Validación de usuario fallida:",
          turnoValidation.errors
        );
        return FormatterResponseService.validationError(
          turnoValidation.errors,
          "ID de usuario inválido"
        );
      }

      // 2. Validar ID de usuario
      const seccionValidacion = ValidationService.validateId(
        parseInt(idSeccion),
        "Id de Sección"
      );
      if (!seccionValidacion.isValid) {
        console.error(
          "❌ Validación de usuario fallida:",
          seccionValidacion.errors
        );
        return FormatterResponseService.validationError(
          seccionValidacion.errors,
          "ID de usuario inválido"
        );
      }

      // 3. Validar ID de usuario
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

      // 3. Asignar turno en el modelo
      console.log("⏰ Asignando turno en base de datos...");
      const respuestaModel = await CurricularModel.asignacionTurnoSeccion(
        idSeccion,
        datos.idTurno,
        user_action
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo asignar turno:", respuestaModel);
        return respuestaModel;
      }

      // 4. Enviar notificación específica para coordinación académica
      console.log("🔔 Enviando notificaciones de asignación de turno...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Turno Asignado a Sección",
        tipo: "turno_asignado",
        contenido: `Se ha asignado un turno a la sección académica`,
        metadatos: {
          seccion_id: idSeccion,
          turno_id: datos.idTurno,
          seccion_nombre: respuestaModel.data?.seccion_nombre,
          turno_nombre: respuestaModel.data?.turno_nombre,
          usuario_asignador: user_action.id,
          fecha_asignacion: new Date().toISOString(),
          url_action: `/academico/secciones/${idSeccion}`,
        },
        roles_ids: [2, 7, 8, 20], // Solo Coordinador, Directores y SuperAdmin
        users_ids: [user_action.id], // Usuario que asignó el turno
      });

      console.log("🎉 Turno asignado exitosamente");

      return FormatterResponseService.success(
        {
          message: "Turno asignado exitosamente",
          asignacion: {
            seccion_id: datos.idSeccion,
            turno_id: datos.idTurno,
            seccion_nombre: respuestaModel.data?.seccion_nombre,
            turno_nombre: respuestaModel.data?.turno_nombre,
          },
        },
        "Turno asignado exitosamente",
        {
          status: 200,
          title: "Turno Asignado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio asignar turno:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizarPNF
   * @description Actualizar un PNF existente
   * @param {number} idPNF - ID del PNF
   * @param {Object} datos - Datos actualizados
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async actualizarPNF(idPNF, datos, user_action) {
    try {
      console.log("🔍 [actualizarPNF] Actualizando PNF ID:", idPNF);

      // Validaciones
      const pnfValidation = ValidationService.validateId(idPNF, "PNF");
      if (!pnfValidation.isValid) {
        return FormatterResponseService.validationError(
          pnfValidation.errors,
          "ID de PNF inválido"
        );
      }

      const usuarioValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!usuarioValidation.isValid) {
        return FormatterResponseService.validationError(
          usuarioValidation.errors,
          "ID de usuario inválido"
        );
      }

      const validation = ValidationService.validatePartialPnf(datos);
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Error de validación en actualización de PNF"
        );
      }

      // Actualizar en modelo
      const respuestaModel = await CurricularModel.actualizarPNF(
        idPNF,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // Notificación GLOBAL (PNF es información institucional)
      console.log("🔔 Enviando notificación GLOBAL de actualización de PNF...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "PNF Actualizado",
        tipo: "pnf_actualizado",
        contenido: `Se han actualizado los datos del Programa Nacional de Formación. Cambios realizados: ${Object.keys(
          datos
        ).join(", ")}`,
        metadatos: {
          pnf_id: idPNF,
          pnf_nombre: datos.nombrePNF,
          campos_actualizados: Object.keys(datos),
          usuario_actualizador: user_action.id,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/academico/pnf`,
        },
        // NO se pasan roles_ids ni users_ids → Notificación global para todos
      });

      return FormatterResponseService.success(
        {
          message: "PNF actualizado exitosamente",
          pnf_id: idPNF,
          cambios: datos,
        },
        "PNF actualizado exitosamente",
        {
          status: 200,
          title: "PNF Actualizado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio actualizar PNF:", error);
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizarDescripcionTrayecto
   * @description Actualizar la descripción de un trayecto específico
   * @param {number} idTrayecto - ID del trayecto
   * @param {Object} datos - Datos de actualización
   * @param {string} datos.descripcionTrayecto - Nueva descripción
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async actualizarDescripcionTrayecto(idTrayecto, datos, user_action) {
    try {
      console.log(
        "🔍 [actualizarDescripcionTrayecto] Actualizando descripción del trayecto ID:",
        idTrayecto
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos de actualización:", {
          idTrayecto,
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar ID del trayecto
      const trayectoValidation = ValidationService.validateId(
        idTrayecto,
        "trayecto"
      );
      if (!trayectoValidation.isValid) {
        return FormatterResponseService.validationError(
          trayectoValidation.errors,
          "ID de trayecto inválido"
        );
      }

      // 2. Validar ID de usuario
      const usuarioValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!usuarioValidation.isValid) {
        return FormatterResponseService.validationError(
          usuarioValidation.errors,
          "ID de usuario inválido"
        );
      }
      console.log(datos);
      // 3. Validar descripción
      if (
        !datos.descripcion_trayecto ||
        datos.descripcion_trayecto.trim() === ""
      ) {
        return FormatterResponseService.error(
          "Descripción requerida",
          "La descripción del trayecto no puede estar vacía",
          400,
          "DESCRIPCION_REQUERIDA"
        );
      }

      const descripcionLimpia = datos.descripcion_trayecto.trim();

      if (descripcionLimpia.length < 10) {
        return FormatterResponseService.error(
          "Descripción muy corta",
          "La descripción debe tener al menos 10 caracteres",
          400,
          "DESCRIPCION_MUY_CORTA"
        );
      }

      if (descripcionLimpia.length > 500) {
        return FormatterResponseService.error(
          "Descripción muy larga",
          "La descripción no puede exceder los 500 caracteres",
          400,
          "DESCRIPCION_MUY_LARGA"
        );
      }

      // 4. Llamar al modelo para actualizar
      const respuestaModel =
        await CurricularModel.actualizarDescripcionTrayecto(
          idTrayecto,
          descripcionLimpia,
          user_action.id
        );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // 5. Enviar notificación específica
      console.log(
        "🔔 Enviando notificación de actualización de descripción de trayecto..."
      );
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Descripción de Trayecto Actualizada",
        tipo: "trayecto_descripcion_actualizada",
        contenido: `Se ha actualizado la descripción del trayecto "${
          respuestaModel.data?.valor_trayecto || "N/A"
        }"`,
        metadatos: {
          trayecto_id: idTrayecto,
          trayecto_nombre: respuestaModel.data?.valor_trayecto,
          pnf_id: respuestaModel.data?.id_pnf,
          descripcion_anterior: respuestaModel.data?.descripcion_anterior,
          descripcion_nueva: descripcionLimpia,
          usuario_actualizador: user_action.id,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/academico/trayectos/${idTrayecto}`,
        },
        roles_ids: [2, 7, 8, 10, 20], // Coordinador, Directores, Vicerrector, SuperAdmin
        users_ids: [user_action.id],
      });

      console.log("🎉 Descripción del trayecto actualizada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Descripción del trayecto actualizada exitosamente",
          trayecto: {
            id: idTrayecto,
            valor_trayecto: respuestaModel.data?.valor_trayecto,
            descripcion_anterior: respuestaModel.data?.descripcion_anterior,
            descripcion_nueva: descripcionLimpia,
            id_pnf: respuestaModel.data?.id_pnf,
          },
        },
        "Descripción del trayecto actualizada exitosamente",
        {
          status: 200,
          title: "Descripción Actualizada",
        }
      );
    } catch (error) {
      console.error(
        "💥 Error en servicio actualizar descripción de trayecto:",
        error
      );
      throw error;
    }
  }
  /**
   * @static
   * @async
   * @method actualizarUnidadCurricular
   * @description Actualizar una Unidad Curricular existente (parcial o completamente)
   * @param {number} idUnidadCurricular - ID de la unidad curricular
   * @param {Object} datos - Datos de actualización
   * @param {string} [datos.codigo_unidad] - Nuevo código de la unidad
   * @param {string} [datos.nombre_unidad_curricular] - Nuevo nombre de la unidad
   * @param {string} [datos.descripcion_unidad_curricular] - Nueva descripción
   * @param {number} [datos.horas_clase] - Nuevas horas de clase
   * @param {number} [datos.id_trayecto] - Nuevo ID del trayecto
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async actualizarUnidadCurricular(
    idUnidadCurricular,
    datos,
    user_action
  ) {
    try {
      console.log(
        "🔍 [actualizarUnidadCurricular] Actualizando unidad curricular ID:",
        idUnidadCurricular
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos de actualización:", {
          idUnidadCurricular,
          datos: JSON.stringify(datos, null, 2),
          user_action: user_action,
        });
      }

      // 1. Validar ID de la unidad curricular
      const unidadValidation =
        ValidationService.validatePartialUnidadCurricular(
          datos,
          "unidad_curricular"
        );

      if (!unidadValidation.isValid) {
        return FormatterResponseService.validationError(
          unidadValidation.errors,
          "Unidad curricular inválida"
        );
      }

      // 2. Validar ID de usuario
      const usuarioValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );
      if (!usuarioValidation.isValid) {
        return FormatterResponseService.validationError(
          usuarioValidation.errors,
          "ID de usuario inválido"
        );
      }

      // 5. Llamar al modelo para actualizar
      const respuestaModel = await CurricularModel.actualizarUnidadCurricular(
        idUnidadCurricular,
        datos,
        user_action.id
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        return respuestaModel;
      }

      // 6. Enviar notificación específica
      console.log(
        "🔔 Enviando notificación de actualización de unidad curricular..."
      );
      const notificationService = new NotificationService();

      await notificationService.crearNotificacionMasiva({
        titulo: "Unidad Curricular Actualizada",
        tipo: "unidad_curricular_actualizada",
        contenido: `Se ha actualizado la unidad curricular "${
          respuestaModel.data?.unidad_curricular?.nombre_unidad_curricular ||
          datos.nombre_unidad_curricular ||
          "N/A"
        }"`,
        metadatos: {
          unidad_curricular_id: idUnidadCurricular,
          unidad_curricular_nombre:
            respuestaModel.data?.unidad_curricular?.nombre_unidad_curricular ||
            datos.nombre_unidad_curricular,
          campos_actualizados:
            respuestaModel.data?.unidad_curricular?.campos_actualizados,
          horas_anteriores:
            respuestaModel.data?.unidad_curricular?.horas_anteriores,
          horas_nuevas: respuestaModel.data?.unidad_curricular?.horas_nuevas,
          usuario_actualizador: user_action.id,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/academico/unidades-curriculares/${idUnidadCurricular}`,
        },
        roles_ids: [2, 7, 8, 10, 20], // Coordinador, Directores, Vicerrector, SuperAdmin
        users_ids: [user_action.id],
      });

      console.log("🎉 Unidad curricular actualizada exitosamente");

      return FormatterResponseService.success(
        {
          message: respuestaModel.message,
          unidad_curricular: respuestaModel.data?.unidad_curricular,
          campos_actualizados:
            respuestaModel.data?.unidad_curricular?.campos_actualizados,
        },
        "Unidad curricular actualizada exitosamente",
        {
          status: 200,
          title: "Unidad Curricular Actualizada",
        }
      );
    } catch (error) {
      console.error(
        "💥 Error en servicio actualizar unidad curricular:",
        error
      );
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method eliminarUnidadCurricular
   * @description Eliminar una Unidad Curricular físicamente del sistema
   * @param {number} idUnidadCurricular - ID de la unidad curricular a eliminar
   * @param {Object} user_action - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  static async eliminarUnidadCurricular(idUnidadCurricular, user_action) {
    try {
      console.log(
        "🔍 [eliminarUnidadCurricular] Iniciando eliminación de unidad curricular..."
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          idUnidadCurricular: idUnidadCurricular,
          user_action: user_action,
        });
      }

      // 1. Validar ID de usuario
      const idUsuarioValidation = ValidationService.validateId(
        user_action.id,
        "usuario"
      );

      if (!idUsuarioValidation.isValid) {
        console.error(
          "❌ Validación de ID de usuario fallida:",
          idUsuarioValidation.errors
        );
        return FormatterResponseService.validationError(
          idUsuarioValidation.errors,
          "ID de usuario inválido"
        );
      }

      // 2. Validar ID de unidad curricular
      const idUnidadValidation = ValidationService.validateId(
        idUnidadCurricular,
        "unidad curricular"
      );

      if (!idUnidadValidation.isValid) {
        console.error(
          "❌ Validación de ID de unidad curricular fallida:",
          idUnidadValidation.errors
        );
        return FormatterResponseService.validationError(
          idUnidadValidation.errors,
          "ID de unidad curricular inválido"
        );
      }

      // 3. Obtener información de la unidad curricular antes de eliminar (para notificaciones)
      console.log("📚 Obteniendo información de la unidad curricular...");
      const infoUnidadCurricular =
        await CurricularModel.obtenerUnidadCurricularPorId(idUnidadCurricular);

      if (FormatterResponseService.isError(infoUnidadCurricular)) {
        console.error(
          "❌ Error al obtener información de unidad curricular:",
          infoUnidadCurricular
        );
        return infoUnidadCurricular;
      }

      // 4. Eliminar unidad curricular en el modelo
      console.log("🗑️ Eliminando unidad curricular en base de datos...");
      const respuestaModel = await CurricularModel.eliminarUnidadCurricular(
        user_action.id,
        idUnidadCurricular
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error(
          "❌ Error en modelo eliminar unidad curricular:",
          respuestaModel
        );
        return respuestaModel;
      }

      // 5. Enviar notificación específica para coordinación académica
      console.log("🔔 Enviando notificaciones de eliminación...");
      const notificationService = new NotificationService();
      await notificationService.crearNotificacionMasiva({
        titulo: "Unidad Curricular Eliminada",
        tipo: "unidad_curricular_eliminada",
        contenido: `Se ha eliminado la unidad curricular "${
          infoUnidadCurricular.data?.nombre_unidad_curricular ||
          "Unidad Desconocida"
        }" (Código: ${
          infoUnidadCurricular.data?.codigo_unidad || "N/A"
        }) del sistema`,
        metadatos: {
          unidad_curricular_nombre:
            infoUnidadCurricular.data?.nombre_unidad_curricular,
          unidad_curricular_codigo: infoUnidadCurricular.data?.codigo_unidad,
          unidad_curricular_id: idUnidadCurricular,
          trayecto_id: infoUnidadCurricular.data?.id_trayecto,
          horas_clase: infoUnidadCurricular.data?.horas_clase,
          usuario_eliminador: user_action.id,
          fecha_eliminacion: new Date().toISOString(),
          url_action: `/academico/unidades-curriculares`,
        },
        roles_ids: [2, 7, 8, 20], // Solo Coordinador, Directores y SuperAdmin
        users_ids: [user_action.id], // Usuario que eliminó la unidad curricular
      });

      console.log("✅ Unidad curricular eliminada exitosamente");

      return FormatterResponseService.success(
        {
          message: "Unidad curricular eliminada exitosamente",
          unidad_curricular_eliminada: {
            id: idUnidadCurricular,
            nombre: infoUnidadCurricular.data?.nombre_unidad_curricular,
            codigo: infoUnidadCurricular.data?.codigo_unidad,
            trayecto_id: infoUnidadCurricular.data?.id_trayecto,
            horas_clase: infoUnidadCurricular.data?.horas_clase,
          },
          registros_afectados: respuestaModel.data?.registros_eliminados || {
            horarios: 0,
            areas_conocimiento: 0,
          },
        },
        "Unidad curricular eliminada permanentemente del sistema",
        {
          status: 200,
          title: "Unidad Curricular Eliminada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio eliminar unidad curricular:", error);

      // Manejo específico de errores de integridad referencial
      if (
        error.message?.includes("foreign_key_violation") ||
        error.message?.includes("integrity constraint")
      ) {
        return FormatterResponseService.error(
          "No se puede eliminar la unidad curricular porque tiene registros asociados en uso",
          "Error de integridad referencial",
          {
            status: 400,
            details: {
              suggestion:
                "Revise los horarios, secciones u otros registros asociados antes de eliminar",
            },
          }
        );
      }

      throw error;
    }
  }
}
