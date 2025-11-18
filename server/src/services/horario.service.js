import HorarioModel from "../models/horario.model.js";
import validationService from "./validation.service.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";
import DocumentServices from "./document.service.js";
import NotificationService from "./notification.service.js";

/**
 * @class HorarioService
 * @description Contiene la lógica de negocio relacionada con los horarios académicos
 */
export default class HorarioService {
  /**
   * Mostrar los horarios de un profesor en específico
   * @param {number} id_profesor
   * @returns {Object} Respuesta formateada con los horarios del profesor
   */
  static async mostrarHorariosProfesores(id_profesor) {
    try {
      const validation = validationService.validateId(id_profesor, "profesor");
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "ID de profesor inválido"
        );
      }

      const dbResponse = await HorarioModel.obtenerPorProfesor(id_profesor);

      // Si el modelo retorna una respuesta formateada, la adaptamos
      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const rows = dbResponse.data || dbResponse;

      // Validar que hay datos
      if (!rows || rows.length === 0) {
        return FormatterResponseService.notFound(
          "No hay Horarios del profesor",
          id_profesor
        );
      }

      // Usar los nombres correctos de las columnas según tu consulta SQL
      const { nombres_profesor, apellidos_profesor } = rows[0];

      // ✅ CORREGIDO: Filtrar solo filas que tengan datos reales de horarios
      const filasConHorarios = rows.filter(
        (row) => row.nombre_unidad_curricular && row.hora_inicio && row.hora_fin
      );

      let horario = [];

      // ✅ CORREGIDO: Solo procesar si hay horarios reales
      if (filasConHorarios.length > 0) {
        const diasUnicos = [
          ...new Set(filasConHorarios.map((d) => d.dia_semana)),
        ];

        // ✅ CORREGIDO: Sintaxis del map corregida
        horario = diasUnicos.map((dia) => ({
          nombre: dia,
          clases: filasConHorarios
            .filter((clase) => clase.dia_semana === dia)
            .map((clase) => ({
              codigo_pnf: clase.codigo_pnf,
              valor_seccion: clase.valor_seccion,
              valor_trayecto: clase.valor_trayecto,
              id: clase.id_horario,
              id_profesor: clase.id_profesor,
              id_aula: clase.id_aula,
              id_unidad_curricular: clase.id_unidad_curricular,
              codigo_aula: clase.codigo_aula,
              nombre_unidad_curricular: clase.nombre_unidad_curricular,
              hora_inicio: clase.hora_inicio,
              hora_fin: clase.hora_fin,
              id_seccion: clase.id_seccion,
              valor_seccion: clase.valor_seccion,
              nombre_pnf: clase.nombre_pnf,
            })),
        }));
      }
      // ✅ Si no hay horarios reales, Horario será un array vacío []

      // Crear configuración con nombres consistentes
      const configuracion = {
        profesor: { id_profesor, nombres_profesor, apellidos_profesor },
        turno: {
          nombre: "Completo",
          hora_inicio: "07:00",
          hora_fin: "20:00",
        },
        horario,
      };

      console.log("✅ Configuración formateada:", configuracion.horario);

      return FormatterResponseService.success(
        configuracion,
        "Horarios del profesor obtenidos exitosamente"
      );
    } catch (error) {
      // Si ya es un error formateado, lo propagamos
      if (error.success === false) {
        throw error;
      }
      // Si es un error crudo, lo formateamos
      return FormatterResponseService.error(
        "Error al obtener horarios del profesor",
        error.message,
        500,
        "HORARIO_PROFESOR_ERROR"
      );
    }
  }

  /**
   * Mostrar los horarios de una sección en específico
   * @param {number} id_seccion
   * @returns {Object} Respuesta formateada con los horarios de la sección
   */
  static async mostrarHorariosPorSeccion(id_seccion) {
    try {
      const validation = validationService.validateId(id_seccion, "sección");
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "ID de sección inválido"
        );
      }

      const dbResponse = await HorarioModel.obtenerPorSeccion(id_seccion);

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      console.log("📊 Respuesta de la base de datos:", dbResponse);

      const rows = dbResponse.data || dbResponse;

      // Validar que hay datos
      if (!rows || rows.length === 0) {
        return FormatterResponseService.notFound("Sección", id_seccion);
      }

      // Usar los nombres correctos de las columnas según tu consulta SQL
      const {
        id_pnf,
        nombre_pnf,
        codigo_pnf,
        valor_trayecto,
        id_trayecto,
        valor_seccion,
        nombre_turno,
        turno_hora_inicio,
        turno_hora_fin,
      } = rows[0];

      // ✅ CORREGIDO: Filtrar solo filas que tengan datos reales de horarios
      const filasConHorarios = rows.filter(
        (row) => row.nombre_unidad_curricular && row.hora_inicio && row.hora_fin
      );

      let horario = [];

      // ✅ CORREGIDO: Solo procesar si hay horarios reales
      if (filasConHorarios.length > 0) {
        const diasUnicos = [
          ...new Set(filasConHorarios.map((d) => d.dia_semana)),
        ];

        // ✅ CORREGIDO: Sintaxis del map corregida
        horario = diasUnicos.map((dia) => ({
          nombre: dia,
          clases: filasConHorarios
            .filter((clase) => clase.dia_semana === dia)
            .map((clase) => ({
              id: clase.id_horario,
              id_profesor: clase.id_profesor,
              id_aula: clase.id_aula,
              id_unidad_curricular: clase.id_unidad_curricular,
              nombres_profesor: clase.nombres_profesor,
              codigo_aula: clase.codigo_aula,
              apellido_profesor: clase.apellidos_profesor,
              nombre_unidad_curricular: clase.nombre_unidad_curricular,
              hora_inicio: clase.hora_inicio,
              hora_fin: clase.hora_fin,
              id_seccion: clase.id_seccion,
              valor_seccion: clase.valor_seccion,
              nombre_pnf: clase.nombre_pnf,
            })),
        }));
      }
      // ✅ Si no hay horarios reales, horario será un array vacío []

      // Crear configuración con nombres consistentes
      const configuracion = {
        pnf: { nombre_pnf, codigo_pnf, id_pnf },
        trayecto: { id_trayecto, valor_trayecto },
        seccion: { valor_seccion, id_seccion },
        turno: {
          nombre: nombre_turno,
          hora_inicio: turno_hora_inicio || "07:00",
          hora_fin: turno_hora_fin || "20:00",
        },
        horario, // ✅ Ahora será [] cuando no haya horarios
      };

      console.log("✅ Configuración formateada:", configuracion.horario);

      return FormatterResponseService.success(
        configuracion,
        "Horarios de la sección obtenidos exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al obtener horarios de la sección",
        error.message,
        500,
        "HORARIO_SECCION_ERROR"
      );
    }
  }

  /**
   * Mostrar los horarios de un aula en específico
   * @param {number} id_aula
   * @returns {Object} Respuesta formateada con los horarios del aula
   */
  static async mostrarHorariosPorAula(id_aula) {
    try {
      const validation = validationService.validateId(id_aula, "aula");
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "ID de aula inválido"
        );
      }

      const dbResponse = await HorarioModel.obtenerPorAula(id_aula);

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const rows = dbResponse.data || dbResponse;
      // Validar que hay datos
      if (!rows || rows.length === 0) {
        return FormatterResponseService.notFound(
          "No hay Horarios del profesor",
          id_profesor
        );
      }

      // Usar los nombres correctos de las columnas según tu consulta SQL
      const { codigo_aula } = rows[0];

      // ✅ CORREGIDO: Filtrar solo filas que tengan datos reales de horarios
      const filasConHorarios = rows.filter(
        (row) => row.nombre_unidad_curricular && row.hora_inicio && row.hora_fin
      );

      let horario = [];

      // ✅ CORREGIDO: Solo procesar si hay horarios reales
      if (filasConHorarios.length > 0) {
        const diasUnicos = [
          ...new Set(filasConHorarios.map((d) => d.dia_semana)),
        ];

        // ✅ CORREGIDO: Sintaxis del map corregida
        horario = diasUnicos.map((dia) => ({
          nombre: dia,
          clases: filasConHorarios
            .filter((clase) => clase.dia_semana === dia)
            .map((clase) => ({
              codigo_pnf: clase.codigo_pnf,
              valor_seccion: clase.valor_seccion,
              valor_trayecto: clase.valor_trayecto,
              id: clase.id_horario,
              id_profesor: clase.id_profesor,
              id_unidad_curricular: clase.id_unidad_curricular,
              nombres_profesor: clase.nombres_profesor,
              apellido_profesor: clase.apellidos_profesor,
              nombre_unidad_curricular: clase.nombre_unidad_curricular,
              hora_inicio: clase.hora_inicio,
              hora_fin: clase.hora_fin,
              id_seccion: clase.id_seccion,
              valor_seccion: clase.valor_seccion,
              nombre_pnf: clase.nombre_pnf,
            })),
        }));
      }
      // ✅ Si no hay horarios reales, Horario será un array vacío []

      // Crear configuración con nombres consistentes
      const configuracion = {
        aula: { id_aula, codigo_aula },
        turno: {
          nombre: "Completo",
          hora_inicio: "07:00",
          hora_fin: "20:00",
        },
        horario,
      };

      console.log("✅ Configuración formateada:", configuracion.horario);

      return FormatterResponseService.success(
        configuracion,
        "Horarios del aula obtenidos exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al obtener horarios del aula",
        error.message,
        500,
        "HORARIO_AULA_ERROR"
      );
    }
  }

  /**
   * Mostrar profesores disponibles según horas necesarias
   * @param {number} id_seccion
   * @param {number} horas_necesarias
   * @param {number} id_unidad_curricular
   * @returns {Object} Respuesta formateada con profesores disponibles
   */
  static async mostrarProfesoresParaHorario(
    id_seccion,
    horas_necesarias,
    id_unidad_curricular = null
  ) {
    try {
      const validationidSeccion = validationService.validateId(
        id_seccion,
        "Id Seccion"
      );
      if (!validationidSeccion.isValid) {
        return FormatterResponseService.validationError(
          validationidSeccion.errors,
          "Id de la seccion inválido"
        );
      }

      const validation = validationService.validateId(
        horas_necesarias,
        "horas necesarias"
      );
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Horas necesarias inválidas"
        );
      }
      if (id_unidad_curricular != null) {
        const validationIdUnidad = validationService.validateId(
          id_unidad_curricular,
          "id unidad curricular"
        );
        if (!validationIdUnidad.isValid) {
          return FormatterResponseService.validationError(
            validationIdUnidad.errors,
            "Id de la unidad curricular inválido"
          );
        }
      }

      const dbResponse = await HorarioModel.obtenerProfesoresDisponibles(
        id_seccion,
        horas_necesarias,
        id_unidad_curricular
      );

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const rows = dbResponse.data || dbResponse;

      return FormatterResponseService.success(
        rows,
        "Profesores disponibles obtenidos exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al obtener profesores disponibles",
        error.message,
        500,
        "PROFESORES_DISPONIBLES_ERROR"
      );
    }
  }

  /**
   * Mostrar profesores disponibles según horas necesarias
   * @param {number} id_profesor
   * @returns {Object} Respuesta formateada con profesores disponibles
   */
  static async mostrarProfesorCambiarHorario(id_profesor) {
    try {
      const validationidSeccion = validationService.validateId(
        id_profesor,
        "Id de profesor"
      );
      if (!validationidSeccion.isValid) {
        return FormatterResponseService.validationError(
          validationidSeccion.errors,
          "Id del profesor inválido"
        );
      }

      const dbResponse = await HorarioModel.mostrarProfesorCambiarHorario(
        id_profesor
      );

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const rows = dbResponse.data || dbResponse;

      return FormatterResponseService.success(
        rows,
        "Profesores disponibles obtenidos exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al obtener profesores disponibles",
        error.message,
        500,
        "PROFESORES_DISPONIBLES_ERROR"
      );
    }
  }

  /**
   * Mostrar profesores disponibles según horas necesarias
   * @param {number} id_aula
   * @returns {Object} Respuesta formateada con profesores disponibles
   */
  static async mostrarAulaCambiarHorario(id_aula) {
    try {
      const validationidSeccion = validationService.validateId(
        id_aula,
        "Id del aula"
      );
      if (!validationidSeccion.isValid) {
        return FormatterResponseService.validationError(
          validationidSeccion.errors,
          "Id del aula inválido"
        );
      }

      const dbResponse = await HorarioModel.mostrarAulaCambiarHorario(id_aula);

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const rows = dbResponse.data || dbResponse;

      return FormatterResponseService.success(
        rows,
        "Profesores disponibles obtenidos exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al obtener profesores disponibles",
        error.message,
        500,
        "PROFESORES_DISPONIBLES_ERROR"
      );
    }
  }

  /**
   * Mostrar aulas disponibles para una seccion y un profesor
   * @param {number} id_seccion - id de la seccion
   * @returns {Object} Respuesta formateada con aulas disponibles
   */
  static async mostrarAulasParaHorario(
    id_seccion,
    horas_necesarias,
    id_profesor
  ) {
    try {
      const validationidSeccion = validationService.validateId(
        id_seccion,
        "id seccion"
      );
      if (!validationidSeccion.isValid) {
        return FormatterResponseService.validationError(
          validationidSeccion.errors,
          "Id de la seccion inválido"
        );
      }

      const validation = validationService.validateId(
        horas_necesarias,
        "horas necesarias"
      );
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "Horas necesarias inválidas"
        );
      }

      const validationidProfesor = validationService.validateId(
        id_profesor,
        "id profesor"
      );
      if (!validationidProfesor.isValid) {
        return FormatterResponseService.validationError(
          validationidProfesor.errors,
          "Id del profesor inválido"
        );
      }
      const dbResponse = await HorarioModel.obtenerAulasDisponibles(
        id_seccion,
        horas_necesarias,
        id_profesor
      );

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const rows = dbResponse.data || dbResponse;

      return FormatterResponseService.success(
        rows,
        "Aulas disponibles obtenidas exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al obtener aulas disponibles",
        error.message,
        500,
        "AULAS_DISPONIBLES_ERROR"
      );
    }
  }

  /**
   * Registrar un nuevo horario
   * @param {object} datos
   * @param {object} usuario_accion
   * @returns {Object} Respuesta formateada del registro
   */
  static async registrarHorario(datos, usuario_accion) {
    try {
      const userValidation = validationService.validateId(
        usuario_accion.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "ID de usuario inválido"
        );
      }

      const horarioValidation = validationService.validateHorario(datos);
      if (!horarioValidation.isValid) {
        return FormatterResponseService.validationError(
          horarioValidation.errors,
          "Error de validación en datos del horario"
        );
      }

      const dbResponse = await HorarioModel.crear(datos, usuario_accion.id);

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const resultado = dbResponse.data || dbResponse;

      // Enviar notificaciones específicas a los involucrados
      console.log("🔔 Enviando notificaciones de horario...");
      const notificationService = new NotificationService();

      const id_profesor = await HorarioModel.obtenerIdUSerProfesor(
        datos.id_profesor
      );

      // Notificación individual para el PROFESOR asignado
      await notificationService.crearNotificacionIndividual({
        titulo: "Nueva Asignación de Horario",
        tipo: "horario_asignado",
        user_id: id_profesor.data[0].id, // El profesor que recibe el horario
        contenido: `Se le ha asignado un nuevo horario para la unidad curricular "${
          datos.nombre_unidad_curricular || "N/A"
        }" en el aula ${datos.codigo_aula || "N/A"}`,
        metadatos: {
          horario_id: resultado.id_horario || resultado.id,
          profesor_id: datos.id_profesor,
          unidad_curricular: datos.nombre_unidad_curricular,
          aula: datos.codigo_aula,
          dia_semana: datos.dia_semana,
          hora_inicio: datos.hora_inicio,
          hora_fin: datos.hora_fin,
          usuario_asignador: usuario_accion.id,
          fecha_asignacion: new Date().toISOString(),
          url_action: `/horarios/profesor/${datos.id_profesor}`,
        },
      });

      // Notificación para COORDINADORES y DIRECTORES relacionados
      await notificationService.crearNotificacionMasiva({
        titulo: "Nuevo Horario Registrado",
        tipo: "horario_creado",
        contenido: `Se ha registrado un nuevo horario para el profesor en el aula ${
          datos.codigo_aula || "N/A"
        }`,
        metadatos: {
          horario_id: resultado.id_horario || resultado.id,
          profesor_id: datos.id_profesor,
          profesor_nombre: datos.nombres_profesor || "Profesor",
          unidad_curricular: datos.nombre_unidad_curricular,
          aula: datos.codigo_aula,
          dia_semana: datos.dia_semana,
          hora_inicio: datos.hora_inicio,
          hora_fin: datos.hora_fin,
          usuario_creador: usuario_accion.id,
          fecha_registro: new Date().toISOString(),
          url_action: `/horarios/gestion`,
        },
        roles_ids: [2, 7, 8, 20], // Solo Coordinador, Directores y SuperAdmin
        users_ids: [usuario_accion.id], // Usuario que creó el horario
      });

      return FormatterResponseService.created(
        resultado,
        "Horario registrado exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al registrar horario",
        error.message,
        error.status,
        "REGISTRO_HORARIO_ERROR"
      );
    }
  }

  /**
   * Generar documento PDF del horario de una sección
   * @param {number} id_seccion
   * @param {object} usuario_accion - Usuario que genera el documento
   * @returns {Object} Respuesta formateada con el buffer del PDF
   */
  static async generarDocumentoHorario(id_seccion, usuario_accion) {
    try {
      const validation = validationService.validateId(id_seccion, "sección");
      if (!validation.isValid) {
        return FormatterResponseService.validationError(
          validation.errors,
          "ID de sección inválido"
        );
      }

      console.log("📥 Generando documento para la sección:", id_seccion);

      // 1️⃣ Obtener datos desde el modelo
      const response = await this.mostrarHorariosPorSeccion(id_seccion);

      if (FormatterResponseService.isError(response)) {
        return response;
      }

      const { data } = response;
      console.log("📊 Datos obtenidos para el documento:", data);

      // 4️ Generar documento
      const { buffer, extension } =
        await DocumentServices.generarDocumentoHorario(data);

      return FormatterResponseService.success(
        {
          buffer,
          fileName: `Horario: ${data.pnf.nombre_pnf.toLowerCase()}-${
            data.trayecto.valor_trayecto
          }-${data.seccion.valor_seccion}.${extension}`,
        },
        "Documento de horario generado exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en HorarioService:", error);

      if (error.success === false) {
        throw error;
      }

      return FormatterResponseService.error(
        "Error al generar documento del horario",
        error.message,
        500,
        "GENERAR_DOCUMENTO_ERROR"
      );
    }
  }

  /**
   * Actualizar un horario existente
   * @param {number} idHorario
   * @param {object} datos
   * @param {object} usuario_accion
   * @returns {Object} Respuesta formateada de la actualización
   */
  static async actualizarHorario(idHorario, datos, usuario_accion) {
    try {
      const userValidation = validationService.validateId(
        usuario_accion.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "ID de usuario inválido"
        );
      }

      const horarioIdValidation = validationService.validateId(
        idHorario,
        "horario"
      );
      if (!horarioIdValidation.isValid) {
        return FormatterResponseService.validationError(
          horarioIdValidation.errors,
          "ID de horario inválido"
        );
      }

      const horarioValidation = validationService.validatePartialHorario(datos);
      if (!horarioValidation.isValid) {
        return FormatterResponseService.validationError(
          horarioValidation.errors,
          "Error de validación en datos del horario"
        );
      }

      const dbResponse = await HorarioModel.actualizar(
        idHorario,
        datos,
        usuario_accion.id
      );

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      const resultado = dbResponse.data || dbResponse;

      // Enviar notificaciones específicas por actualización de horario
      console.log("🔔 Enviando notificaciones de actualización de horario...");
      const notificationService = new NotificationService();

      // Obtener información del horario actualizado para notificar al profesor
      const horarioInfo = await HorarioModel.obtenerPorId(idHorario);
      const id_profesor = await HorarioModel.obtenerIdUSerProfesor(
        datos.id_profesor
      );

      if (horarioInfo && horarioInfo.data && horarioInfo.data.length > 0) {
        const horario = horarioInfo.data[0];

        // Notificación individual para el PROFESOR afectado
        await notificationService.crearNotificacionIndividual({
          titulo: "Horario Actualizado",
          tipo: "horario_actualizado",
          user_id: id_profesor.data[0].id,
          contenido: `Se han realizado modificaciones en su horario asignado. Verifique los cambios realizados.`,
          metadatos: {
            horario_id: idHorario,
            profesor_id: horario.id_profesor,
            campos_actualizados: Object.keys(datos),
            usuario_actualizador: usuario_accion.id,
            fecha_actualizacion: new Date().toISOString(),
            url_action: `/horarios/profesor/${horario.id_profesor}`,
          },
        });
      }

      // Notificación para coordinadores/directores
      await notificationService.crearNotificacionMasiva({
        titulo: "Horario Actualizado",
        tipo: "horario_modificado",
        contenido: `Se han realizado cambios en el horario ID: ${idHorario}`,
        metadatos: {
          horario_id: idHorario,
          campos_actualizados: Object.keys(datos),
          usuario_actualizador: usuario_accion.id,
          fecha_actualizacion: new Date().toISOString(),
          url_action: `/horarios/gestion`,
        },
        roles_ids: [2, 7, 8, 20], // Solo Coordinador, Directores y SuperAdmin
        users_ids: [usuario_accion.id],
      });

      return FormatterResponseService.success(
        resultado,
        "Horario actualizado exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al actualizar horario",
        error.message,
        error.status,
        "ACTUALIZAR_HORARIO_ERROR"
      );
    }
  }

  /**
   * Eliminar un horario
   * @param {number} idHorario
   * @param {object} usuario_accion
   * @returns {Object} Respuesta formateada de la eliminación
   */
  static async eliminarHorario(idHorario, usuario_accion) {
    try {
      console.log("🚨 Iniciando proceso de eliminación de horario:", idHorario);
      const userValidation = validationService.validateId(
        usuario_accion.id,
        "usuario"
      );
      if (!userValidation.isValid) {
        return FormatterResponseService.validationError(
          userValidation.errors,
          "ID de usuario inválido"
        );
      }

      const horarioValidation = validationService.validateId(
        idHorario,
        "horario"
      );
      if (!horarioValidation.isValid) {
        return FormatterResponseService.validationError(
          horarioValidation.errors,
          "ID de horario inválido"
        );
      }

      // Obtener información del horario antes de eliminarlo para notificar
      const horarioInfo = await HorarioModel.obtenerPorId(idHorario);
      if (!horarioInfo || !horarioInfo.data || horarioInfo.data.length === 0) {
        return FormatterResponseService.notFound("Horario", idHorario);
      }

      const horario = horarioInfo.data[0];

      const dbResponse = await HorarioModel.eliminar(
        idHorario,
        usuario_accion.id
      );

      if (dbResponse && dbResponse.state === "error") {
        return FormatterResponseService.fromDatabaseResponse(dbResponse);
      }

      // Enviar notificaciones específicas por eliminación de horario
      console.log("🔔 Enviando notificaciones de eliminación de horario...");
      const notificationService = new NotificationService();

      const id_profesor = await HorarioModel.obtenerIdUSerProfesor(
        horario.id_profesor
      );

      // Notificación individual para el PROFESOR afectado
      await notificationService.crearNotificacionIndividual({
        titulo: "Horario Eliminado",
        tipo: "horario_eliminado",
        user_id: id_profesor.data[0].id,
        contenido: `Se ha eliminado su horario asignado para ${horario.nombre_unidad_curricular} en el aula ${horario.codigo_aula}`,
        metadatos: {
          horario_id: idHorario,
          profesor_id: horario.id_profesor,
          unidad_curricular: horario.nombre_unidad_curricular,
          aula: horario.codigo_aula,
          dia_semana: horario.dia_semana,
          usuario_eliminador: usuario_accion.id,
          fecha_eliminacion: new Date().toISOString(),
        },
      });

      // Notificación para coordinadores/directores
      await notificationService.crearNotificacionMasiva({
        titulo: "Horario Eliminado",
        tipo: "horario_eliminado_admin",
        contenido: `Se ha eliminado el horario del profesor ${horario.nombres_profesor} ${horario.apellidos_profesor}`,
        metadatos: {
          horario_id: idHorario,
          profesor_id: horario.id_profesor,
          profesor_nombre: `${horario.nombres_profesor} ${horario.apellidos_profesor}`,
          unidad_curricular: horario.nombre_unidad_curricular,
          aula: horario.codigo_aula,
          usuario_eliminador: usuario_accion.id,
          fecha_eliminacion: new Date().toISOString(),
          url_action: `/horarios/gestion`,
        },
        roles_ids: [2, 7, 8, 20], // Solo Coordinador, Directores y SuperAdmin
        users_ids: [usuario_accion.id],
      });

      return FormatterResponseService.success(
        { horario_id: idHorario },
        "Horario eliminado exitosamente"
      );
    } catch (error) {
      if (error.success === false) {
        throw error;
      }
      return FormatterResponseService.error(
        "Error al eliminar horario",
        error.message,
        error.status,
        "ELIMINAR_HORARIO_ERROR"
      );
    }
  }
}
