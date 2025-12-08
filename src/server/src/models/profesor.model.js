/*
Importación de la clase para el formateo de los datos que se reciben de la BD y
su procesamiento para devolver al controlador un resultado estandarizado.
*/
import FormatResponseModel from "../utils/FormatterResponseModel.js";
import { convertToPostgresArray } from "../utils/utilis.js";

// Importación de Knex
import db from "../database/db.js";

/**
 * @class ProfesorModel
 * @description Esta clase se encarga exclusivamente de interactuar con la base de datos.
 * Solo contiene operaciones CRUD y consultas directas a la BD usando Knex.
 */
export default class ProfesorModel {
  /**
   * @static
   * @async
   * @method crear
   * @description Crear un nuevo profesor en la base de datos
   * @param {Object} datos - Datos del profesor
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async crear(datos, usuarioId) {
    try {
      console.log("🔍 [ProfesorModel.crear] Iniciando creación de profesor...");
      
      const Areasconocimiento = datos.areas_de_conocimiento.map((area) => {
        return area.nombre_area_conocimiento;
      });
      
      console.log("Áreas de conocimiento:", Areasconocimiento);
      
      const {
        cedula,
        nombres,
        apellidos,
        email,
        direccion,
        telefono_movil,
        telefono_local,
        fecha_nacimiento,
        genero,
        fecha_ingreso,
        dedicacion,
        categoria,
        municipio,
        pre_grado,
        pos_grado,
        password,
        imagen = null,
      } = datos;

      // Ejecutar procedimiento almacenado con Knex
      const result = await db.raw(
        `CALL registrar_profesor_completo(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          usuarioId,
          cedula,
          nombres,
          apellidos,
          email,
          direccion,
          password,
          telefono_movil,
          telefono_local || null,
          fecha_nacimiento,
          genero,
          categoria,
          dedicacion,
          pre_grado,
          pos_grado,
          convertToPostgresArray(Areasconocimiento),
          imagen,
          municipio,
          fecha_ingreso,
        ]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Profesor creado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.crear",
        usuario_id: usuarioId,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al crear el profesor"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerTodos
   * @description Obtener profesores con paginación, ordenamiento y búsqueda, o un profesor específico por ID
   */
  static async obtenerTodos(queryParams = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort_order = "nombres",
        search = "",
        id_profesor = null,
      } = queryParams;

      // Si se proporciona un ID específico
      if (id_profesor) {
        const profesor = await db("profesores_informacion_completa")
          .where({ id_profesor })
          .first();

        if (!profesor) {
          return FormatResponseModel.respuestaPostgres(
            { profesor: null },
            "Profesor no encontrado"
          );
        }

        return FormatResponseModel.respuestaPostgres(
          { profesor },
          "Profesor obtenido exitosamente"
        );
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Validar campos de ordenamiento
      const allowedSortFields = {
        nombres: "nombres",
        apellidos: "apellidos",
        cedula: "cedula",
        fecha_creacion: "fecha_creacion",
        categoria: "categoria",
        dedicacion: "dedicacion",
      };

      const sortField = allowedSortFields[sort_order] || "nombres";

      // Construir query base
      let query = db("profesores_informacion_completa");

      // Aplicar búsqueda si existe
      if (search && search.trim() !== "") {
        const isProfesorId = /^\d+$/.test(search.trim());
        
        if (isProfesorId) {
          query = query.where("id_profesor", parseInt(search.trim()));
        } else {
          query = query.where(function() {
            this.where("nombres", "ilike", `%${search.trim()}%`)
              .orWhere("apellidos", "ilike", `%${search.trim()}%`)
              .orWhere("cedula", "ilike", `%${search.trim()}%`);
          });
        }
      }

      // Obtener total de registros
      const countResult = await query.clone().count("* as total").first();
      const total = parseInt(countResult.total);

      // Aplicar paginación y ordenamiento
      const profesores = await query
        .orderBy(sortField, "asc")
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      return FormatResponseModel.respuestaPostgres(
        {
          profesores,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        "Profesores obtenidos exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.obtenerTodos",
        queryParams,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los profesores"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarProfesoresEliminados
   */
  static async mostrarProfesoresEliminados(queryParams) {
    try {
      const {
        page = 1,
        limit = 20,
        sort_order = "nombres",
        search = "",
        id_profesor = null,
      } = queryParams;

      // Si se proporciona un ID específico
      if (id_profesor) {
        const profesor = await db("vista_profesores_eliminados")
          .where({ id_profesor })
          .first();

        if (!profesor) {
          return FormatResponseModel.respuestaPostgres(
            { profesor: null },
            "Profesor no encontrado"
          );
        }

        return FormatResponseModel.respuestaPostgres(
          { profesor },
          "Profesor obtenido exitosamente"
        );
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Construir query base
      let query = db("vista_profesores_eliminados");

      // Aplicar búsqueda si existe
      if (search) {
        query = query.where(function() {
          this.where("nombres", "ilike", `%${search}%`)
            .orWhere("apellidos", "ilike", `%${search}%`)
            .orWhere("cedula", "ilike", `%${search}%`);
        });
      }

      // Obtener total
      const countResult = await query.clone().count("* as total").first();
      const total = parseInt(countResult.total);

      // Obtener datos paginados
      const profesores = await query
        .orderBy(sort_order, "asc")
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      return FormatResponseModel.respuestaPostgres(
        {
          profesores,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        "Profesores eliminados obtenidos exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en mostrarProfesoresEliminados:", error);
      error.details = {
        path: "ProfesorModel.mostrarProfesoresEliminados",
        queryParams,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los profesores eliminados"
      );
    }
  }

  /**
   * @static
   * @async
   * @method mostrarDisponibilidad
   */
  static async mostrarDisponibilidad(id_profesor) {
    try {
      const disponibilidad = await db("vista_disponibilidad_docente")
        .where({ id_profesor });

      return FormatResponseModel.respuestaPostgres(
        disponibilidad,
        "Disponibilidad obtenida exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.mostrarDisponiblidad",
        id_profesor,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener la disponibilidad"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerConFiltros
   */
  static async obtenerConFiltros(filtros) {
    try {
      const { dedicacion, categoria, ubicacion, area, fecha, genero } = filtros;

      // Usar raw para función PostgreSQL
      const result = await db.raw(
        `SELECT * FROM mostrar_profesor(?, ?, ?, ?, ?, ?)`,
        [dedicacion, categoria, ubicacion, area, fecha, genero]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows,
        "Profesores filtrados obtenidos exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.obtenerConFiltros",
        filtros,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener profesores con filtros"
      );
    }
  }

  /**
   * @static
   * @async
   * @method buscar
   */
  static async buscar(busqueda) {
    try {
      const profesores = await db("profesores_informacion_completa")
        .where("nombres", "ilike", `%${busqueda}%`)
        .orWhere("apellidos", "ilike", `%${busqueda}%`)
        .orWhere("cedula", "ilike", `%${busqueda}%`);

      return FormatResponseModel.respuestaPostgres(
        profesores,
        "Búsqueda de profesores completada"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.buscar",
        busqueda,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al buscar profesores"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerImagen
   */
  static async obtenerImagen(idProfesor) {
    try {
      const imagen = await db("users")
        .select("imagen")
        .where({ cedula: idProfesor })
        .first();

      return FormatResponseModel.respuestaPostgres(
        imagen ? [imagen] : [],
        imagen ? "Imagen del profesor obtenida" : "Imagen no encontrada"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.obtenerImagen",
        id_profesor: idProfesor,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener la imagen del profesor"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerPregrados
   */
  static async obtenerPregrados() {
    try {
      const pregrados = await db("pre_grado")
        .select("id_pre_grado", "nombre_pre_grado", "tipo_pre_grado");

      return FormatResponseModel.respuestaPostgres(
        pregrados,
        "Pregrados obtenidos exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.obtenerPregrados",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los pregrados"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerPosgrados
   */
  static async obtenerPosgrados() {
    try {
      const posgrados = await db("pos_grado")
        .select("id_pos_grado", "nombre_pos_grado", "tipo_pos_grado");

      return FormatResponseModel.respuestaPostgres(
        posgrados,
        "Posgrados obtenidos exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.obtenerPosgrados",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener los posgrados"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerAreasConocimiento
   */
  static async obtenerAreasConocimiento() {
    try {
      const areas = await db("areas_de_conocimiento")
        .select("id_area_conocimiento", "nombre_area_conocimiento");

      return FormatResponseModel.respuestaPostgres(
        areas,
        "Áreas de conocimiento obtenidas exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.obtenerAreasConocimiento",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener las áreas de conocimiento"
      );
    }
  }

  /**
   * @static
   * @async
   * @method crearPregrado
   */
  static async crearPregrado(datos, usuarioId) {
    try {
      const { nombre_pre_grado, tipo_pre_grado } = datos;

      const result = await db.raw(
        `CALL registrar_pre_grado(?, ?, ?, NULL)`,
        [usuarioId, nombre_pre_grado, tipo_pre_grado]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Pregrado creado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.crearPregrado",
        usuario_id: usuarioId,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al crear el pregrado"
      );
    }
  }

  /**
   * @static
   * @async
   * @method crearPosgrado
   */
  static async crearPosgrado(datos, usuarioId) {
    try {
      const { nombre_pos_grado, tipo_pos_grado } = datos;

      const result = await db.raw(
        `CALL registrar_pos_grado(?, ?, ?, NULL)`,
        [usuarioId, nombre_pos_grado, tipo_pos_grado]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Posgrado creado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.crearPosgrado",
        usuario_id: usuarioId,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al crear el posgrado"
      );
    }
  }

  /**
   * @static
   * @async
   * @method crearAreaConocimiento
   */
  static async crearAreaConocimiento(datos, usuarioId) {
    try {
      const { area_conocimiento } = datos;

      const result = await db.raw(
        `CALL registrar_area_conocimiento(?, ?, NULL)`,
        [usuarioId, area_conocimiento]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Área de conocimiento creada exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.crearAreaConocimiento",
        usuario_id: usuarioId,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al crear el área de conocimiento"
      );
    }
  }

  /**
   * @static
   * @async
   * @method crearDisponibilidad
   */
  static async crearDisponibilidad(id_profesor, datos, usuarioId) {
    try {
      const { dia_semana, hora_inicio, hora_fin } = datos;

      const result = await db.raw(
        `CALL registrar_disponibilidad_docente_completo(?, ?, ?, ?, ?, NULL)`,
        [usuarioId, id_profesor, dia_semana, hora_inicio, hora_fin]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Disponibilidad creada exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.crearDisponibilidad",
        usuario_id: usuarioId,
        profesor_id: id_profesor,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al crear la disponibilidad"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizarDisponibilidad
   */
  static async actualizarDisponibilidad(id_disponibilidad, datos, usuarioId) {
    try {
      const { dia_semana, hora_inicio, hora_fin } = datos;

      // Validaciones básicas
      if (!dia_semana || !hora_inicio || !hora_fin) {
        throw new Error("Datos incompletos para actualizar disponibilidad");
      }

      const result = await db.raw(
        `CALL actualizar_disponibilidad_docente(?, ?, ?, ?, ?, NULL)`,
        [usuarioId, id_disponibilidad, dia_semana, hora_inicio, hora_fin]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Disponibilidad actualizada exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.actualizarDisponibilidad",
        usuario_id: usuarioId,
        disponibilidad_id: id_disponibilidad,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al actualizar la disponibilidad"
      );
    }
  }

  /**
   * @static
   * @async
   * @method eliminarDisponibilidad
   */
  static async eliminarDisponibilidad(id_disponibilidad, usuarioId) {
    try {
      const result = await db.raw(
        `CALL eliminar_disponibilidad_docente(?, ?, NULL)`,
        [usuarioId, id_disponibilidad]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Disponibilidad eliminada exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.eliminarDisponibilidad",
        usuario_id: usuarioId,
        disponibilidad_id: id_disponibilidad,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al eliminar la disponibilidad"
      );
    }
  }

  /**
   * @static
   * @async
   * @method actualizar
   */
  static async actualizar(datos, usuarioId) {
    try {
      const {
        id_profesor,
        nombres,
        apellidos,
        email,
        direccion,
        password,
        telefono_movil,
        telefono_local,
        fecha_nacimiento,
        genero,
        categoria,
        dedicacion,
        pre_grados,
        pos_grados,
        areas_de_conocimiento,
        imagen,
        municipio,
        fecha_ingreso,
      } = datos;

      const result = await db.raw(
        `CALL actualizar_profesor_completo_o_parcial(
          NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [
          usuarioId,
          id_profesor,
          nombres,
          apellidos,
          email,
          direccion,
          password,
          telefono_movil,
          telefono_local,
          fecha_nacimiento,
          genero,
          categoria,
          dedicacion,
          pre_grados,
          pos_grados,
          areas_de_conocimiento,
          imagen,
          municipio,
          fecha_ingreso,
        ]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Profesor actualizado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.actualizar",
        usuario_id: usuarioId,
        id_profesor: datos.id_profesor,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al actualizar el profesor"
      );
    }
  }

  /**
   * @static
   * @async
   * @method eliminar
   */
  static async eliminar(datos, usuarioId) {
    try {
      const { id_usuario, tipo_accion, razon, observaciones, fecha_efectiva } =
        datos;

      const result = await db.raw(
        `CALL eliminar_destituir_profesor(NULL, ?, ?, ?, ?, ?, ?)`,
        [usuarioId, id_usuario, tipo_accion, razon, observaciones, fecha_efectiva]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Profesor eliminado/destituido exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.eliminar",
        usuario_id: usuarioId,
        id_usuario: datos.id_usuario,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al eliminar/destituir el profesor"
      );
    }
  }

  /**
   * @static
   * @async
   * @method reingresar
   */
  static async reingresar(datos, usuarioId) {
    try {
      const {
        id_usuario,
        tipo_reingreso,
        motivo_reingreso,
        observaciones,
        fecha_efectiva,
        registro_anterior_id,
      } = datos;

      const result = await db.raw(
        `CALL reingresar_profesor(NULL, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuarioId,
          id_usuario,
          tipo_reingreso,
          motivo_reingreso,
          observaciones,
          fecha_efectiva,
          registro_anterior_id,
        ]
      );

      return FormatResponseModel.respuestaPostgres(
        result.rows || result,
        "Profesor reingresado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.reingresar",
        usuario_id: usuarioId,
        id_usuario: datos.id_usuario,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al reingresar el profesor"
      );
    }
  }
}