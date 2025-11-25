import pg from "../database/pg.js";
import FormatResponseModel from "../utils/FormatterResponseModel.js";

export default class HorarioModel {
  /**
   * @name obtenerPorProfesor
   * @description Obtener horarios por ID de profesor
   * @param {number} id_profesor - ID del profesor
   * @returns {Object} Respuesta formateada con los horarios del profesor
   */
  static async obtenerPorProfesor(id_profesor) {
    try {
      const { rows } = await pg.query(
        "SELECT * FROM public.clases_completas WHERE id_profesor = $1",
        [id_profesor]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Horarios obtenidos exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los horarios del profesor"
      );
    }
  }

  /**
   * @name obtenerPorId
   * @description Obtener horarios por ID del horario
   * @param {number} id_horario - ID del horario
   * @returns {Object} Respuesta formateada con los horarios del profesor
   */
  static async obtenerPorId(id_horario) {
    try {
      const { rows } = await pg.query(
        "SELECT * FROM public.clases_completas WHERE id_horario = $1",
        [id_horario]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Horarios obtenidos exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los horarios del profesor"
      );
    }
  }
  /**
   * @name obtenerIdUSerProfesor
   * @description Obtener id_cedula del profesor para enviarle notificacion sobre sus horarios
   * @param {number} id_profesor - ID del profesor
   * @returns {Object} Respuesta formateada con los horarios del profesor
   */
  static async obtenerIdUSerProfesor(id_profesor) {
    try {
      const { rows } = await pg.query(
        "SELECT id_cedula as id FROM profesores WHERE id_profesor = $1",
        [id_profesor]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Cedula obtenida exitosa"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener la cedula del profesor"
      );
    }
  }

  /**
   * @name obtenerPorSeccion
   * @description Obtener horarios por ID de sección
   * @param {number} id_seccion - ID de la sección
   * @returns {Object} Respuesta formateada con los horarios de la sección
   */
  static async obtenerPorSeccion(id_seccion) {
    try {
      const { rows } = await pg.query(
        `SELECT 
          id_pnf,
          id_horario,
          id_profesor,
          id_trayecto,
          nombres_profesor,
          apellidos_profesor,
          id_unidad_curricular,
          nombre_unidad_curricular,
          valor_seccion,
          id_seccion,
          valor_trayecto,
          nombre_pnf,
          nombre_turno,
          turno_hora_inicio,
          turno_hora_fin,
          codigo_aula,
          id_aula,
          hora_inicio,
          hora_fin,
          dia_semana,
          nombre_pnf,
          codigo_pnf
         FROM public.clases_completas 
         WHERE id_seccion = $1`,
        [id_seccion]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Horarios de sección obtenidos exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los horarios de la sección"
      );
    }
  }

  /**
   * @name obtenerPorAula
   * @description Obtener horarios por ID de aula
   * @param {number} id_aula - ID del aula
   * @returns {Object} Respuesta formateada con los horarios del aula
   */
  static async obtenerPorAula(id_aula) {
    try {
      const { rows } = await pg.query(
        "SELECT * FROM public.clases_completas WHERE id_aula = $1",
        [id_aula]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Horarios de aula obtenidos exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los horarios del aula"
      );
    }
  }

  /**
   * @name mostrarProfesorCambiarHorario
   * @description Obtener profesores con horas disponibles
   * @param {number} id_profesor - id del profesor
   * @returns {Object} Respuesta formateada con profesores disponibles
   */
  static async mostrarProfesorCambiarHorario(id_profesor) {
    try {
      const { rows } = await pg.query(
        `SELECT * FROM buscar_profesor_cambiar_horario($1) AS p_resultado;`,
        [id_profesor]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Profesores disponibles obtenidos exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener profesores disponibles"
      );
    }
  }

  /**
   * @name mostrarAulaCambiarHorario
   * @description Obtener profesores con horas disponibles
   * @param {number} id_aula - id del aula
   * @returns {Object} Respuesta formateada con profesores disponibles
   */
  static async mostrarAulaCambiarHorario(id_aula) {
    try {
      const { rows } = await pg.query(
        `SELECT * FROM buscar_aula_cambiar_horario($1) AS p_resultado;`,
        [id_aula]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Profesores disponibles obtenidos exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener profesores disponibles"
      );
    }
  }

  /**
   * @name obtenerProfesoresDisponibles
   * @description Obtener profesores con horas disponibles según el contexto
   * ... (omitted JSDoc)
   */
  static async obtenerProfesoresDisponibles(
    id_seccion,
    horasNecesarias,
    id_unidad_curricular,
    search,
    modo = "general"
  ) {
    try {
      let funcionPostgres;
      let parametros;
      let consultaSQL; // <<-- Nueva variable para la consulta específica

      switch (modo) {
        case "nueva_asignacion":
          if (!id_unidad_curricular) {
            throw new Error(
              "Para nueva asignación se requiere id_unidad_curricular"
            );
          }
          funcionPostgres = "buscar_profesores_nueva_asignacion";
          parametros = [
            id_seccion,
            horasNecesarias,
            id_unidad_curricular,
            search || null,
          ];
          // Construcción de la consulta con 4 parámetros
          consultaSQL = `SELECT * FROM ${funcionPostgres}($1, $2, $3, $4) AS p_resultado;`;
          console.log(consultaSQL, parametros);
          break;

        case "completar_horas":
          if (!id_unidad_curricular) {
            throw new Error(
              "Para completar horas se requiere id_unidad_curricular"
            );
          }
          funcionPostgres = "buscar_profesores_completar_horas";
          parametros = [id_seccion, id_unidad_curricular];
          // Construcción de la consulta con 2 parámetros
          consultaSQL = `SELECT * FROM ${funcionPostgres}($1, $2) AS p_resultado;`;
          console.log(consultaSQL, parametros);
          break;

        case "general":
        default:
          funcionPostgres = "buscar_profesores_general";
          parametros = [id_seccion, horasNecesarias, search || null];
          // Construcción de la consulta con 3 parámetros
          consultaSQL = `SELECT * FROM ${funcionPostgres}($1, $2, $3) AS p_resultado;`;
          console.log(consultaSQL, parametros);
          break;
      }

      // Usar la consulta y los parámetros definidos en el switch
      const { rows } = await pg.query(
        consultaSQL, // <<-- Uso de la variable dinámica
        parametros
      );

      return FormatResponseModel.respuestaPostgres(
        rows,
        `Profesores disponibles obtenidos exitosamente (modo: ${modo})`
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        `Error al obtener profesores disponibles (modo: ${modo})`
      );
    }
  }

  /**
   * @name obtenerAulasDisponibles
   * @description Obtener aulas disponibles por PNF
   * @param {number} id_seccion - id de la seccion
   * @param {number} horasNecesarias - horas necesarias
   * @param {number} id_profesor - id de la profesor
   * @param {number} id_unidad_curricular - id de la unidad curricular (opcional)
   * @param {string} busqueda_aula - término de búsqueda (opcional)
   * @returns {Object} Respuesta formateada con aulas disponibles
   */
  static async obtenerAulasDisponibles(
    id_seccion,
    id_profesor,
    horasNecesarias,
    id_unidad_curricular = null,
    busqueda_aula = null
  ) {
    try {
      const { rows } = await pg.query(
        "SELECT * FROM buscar_aulas_disponibles($1, $2, $3, $4, $5) AS p_resultado;",
        [
          id_seccion,
          id_profesor,
          horasNecesarias,
          id_unidad_curricular,
          busqueda_aula,
        ]
      );

      console.log("✅ Resultado de aulas:", rows);
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Aulas disponibles obtenidas exitosamente"
      );
    } catch (error) {
      console.error("❌ Error al obtener aulas:", error);
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener aulas disponibles"
      );
    }
  }
  /**
   * @name crear
   * @description Crear un nuevo horario
   * @param {Object} datos - Datos del horario
   * @param {number} datos.id_seccion - ID de la sección
   * @param {number} datos.id_profesor - ID del profesor
   * @param {number} datos.id_unidad_curricular - ID de la unidad curricular
   * @param {number} datos.id_aula - ID del aula
   * @param {string} datos.dia_semana - Día de la semana
   * @param {string} datos.hora_inicio - Hora de inicio
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Object} Respuesta formateada del resultado
   */
  static async crear(datos, usuarioId) {
    try {
      const {
        id_seccion,
        id_profesor,
        id_unidad_curricular,
        id_aula,
        dia_semana,
        horas_clase,
        hora_inicio,
      } = datos;

      const { rows } = await pg.query(
        "CALL public.registrar_horario_completo($1, $2, $3, $4, $5, $6, $7, TRUE, $8, NULL)",
        [
          usuarioId,
          id_seccion,
          id_profesor,
          id_unidad_curricular,
          id_aula,
          dia_semana,
          hora_inicio,
          horas_clase,
        ]
      );
      console.log(rows);
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Horario creado exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al crear el horario"
      );
    }
  }

  /**
   * @name actualizar
   * @description Actualizar un horario existente (solo hora_inicio, hora_fin y dia_semana)
   * @param {number} idHorario - ID del horario a actualizar
   * @param {Object} datos - Datos actualizados
   * @param {string} [datos.dia_semana] - Nuevo día de la semana
   * @param {string} [datos.hora_inicio] - Nueva hora de inicio
   * @param {string} [datos.hora_fin] - Nueva hora de fin
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Object} Respuesta formateada del resultado
   */
  static async actualizar(idHorario, datos, usuarioId) {
    try {
      console.log("📊 [HorarioModel.actualizar] Actualizando horario:", {
        idHorario,
        datos,
        usuarioId,
      });

      const { rows } = await pg.query(
        "CALL public.actualizar_horario_completo_o_parcial($1, $2, $3, $4, $5, $6)",
        [
          usuarioId,
          idHorario,
          datos.dia_semana || null,
          datos.hora_inicio || null,
          datos.horas_clase || null,
          null,
        ]
      );
      console.log(rows[0].p_resultado);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Horario actualizado exitosamente"
      );
    } catch (error) {
      console.error("💥 Error en HorarioModel.actualizar:", error);
      throw FormatResponseModel.respuestaError(
        error,
        "Error al actualizar el horario"
      );
    }
  }

  /**
   * @name eliminar
   * @description Eliminar un horario
   * @param {number} idHorario - ID del horario a eliminar
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Object} Respuesta formateada del resultado
   */
  static async eliminar(idHorario, usuarioId) {
    try {
      const { rows } = await pg.query(
        "CALL public.eliminar_horario($1, $2, NULL)",
        [usuarioId, idHorario]
      );
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Horario eliminado exitosamente"
      );
    } catch (error) {
      throw FormatResponseModel.respuestaError(
        error,
        "Error al eliminar el horario"
      );
    }
  }
}
