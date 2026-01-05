/*
Importación de la clase para el formateo de los datos que se reciben de la BD y
su procesamiento para devolver al controlador un resultado estandarizado.
*/
import FormatResponseModel from "../utils/FormatterResponseModel.js";
import { convertToPostgresArray } from "../utils/utilis.js";

// Importación de la conexión con la base de datos
import client from "../database/pg.js";

/**
 * @class ProfesorModel
 * @description Esta clase se encarga exclusivamente de interactuar con la base de datos.
 * Solo contiene operaciones CRUD y consultas directas a la BD.
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
      console.log(Areasconocimiento);
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

      const query =
        "CALL registrar_profesor_completo($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NULL)";
      const values = [
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
      ];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @param {Object} queryParams - Parámetros de consulta
   * @param {number} queryParams.page - Página actual (default: 1)
   * @param {number} queryParams.limit - Límite por página (default: 20)
   * @param {string} queryParams.sort_order - Campo para ordenar (default: nombres)
   * @param {string} queryParams.search - Término de búsqueda
   * @param {string} queryParams.id_profesor - ID específico del profesor a buscar
   * @returns {Promise<Object>} Lista de profesores paginada o profesor específico
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

      // Si se proporciona un ID específico, buscar solo ese profesor
      if (id_profesor) {
        const specificQuery = `
        SELECT * FROM profesores_informacion_completa 
        WHERE id_profesor = $1
      `;

        const specificResult = await client.query(specificQuery, [id_profesor]);

        if (specificResult.rows.length === 0) {
          return FormatResponseModel.respuestaPostgres(
            { profesor: null },
            "Profesor no encontrado"
          );
        }

        return FormatResponseModel.respuestaPostgres(
          {
            profesor: specificResult.rows[0],
          },
          "Profesor obtenido exitosamente"
        );
      }

      // Calcular offset para paginación normal
      const offset = (page - 1) * limit;

      // Validar y mapear campos de ordenamiento
      const allowedSortFields = {
        nombres: "nombres",
        apellidos: "apellidos",
        cedula: "cedula",
        fecha_creacion: "fecha_creacion",
        categoria: "categoria",
        dedicacion: "dedicacion",
      };

      const sortField = allowedSortFields[sort_order] || "nombres";
      const orderBy = `${sortField} ASC`;

      // Construir consulta base
      let whereClause = "";
      let queryParamsArray = [];
      let paramCount = 0;

      if (search && search.trim() !== "") {
        // Verificar si el search es exactamente un ID de profesor (solo números)
        const isProfesorId = /^\d+$/.test(search.trim());

        if (isProfesorId) {
          // Si es un ID, buscar EXCLUSIVAMENTE por ID
          whereClause = `WHERE id_profesor = $1`;
          queryParamsArray = [parseInt(search.trim())];
          paramCount = 1;
        } else {
          // Si no es un ID, buscar en nombres, apellidos y cédula
          whereClause = `WHERE (nombres ILIKE $1 OR apellidos ILIKE $2 OR cedula::text ILIKE $3)`;
          queryParamsArray = [
            `%${search.trim()}%`,
            `%${search.trim()}%`,
            `%${search.trim()}%`,
          ];
          paramCount = 3;
        }
      }

      // Consulta para los datos
      const dataQuery = `
      SELECT * FROM profesores_informacion_completa 
      ${whereClause}
      ORDER BY ${orderBy} 
      LIMIT $${paramCount + 1} 
      OFFSET $${paramCount + 2}
    `;

      // Consulta para el total
      const countQuery = `
      SELECT COUNT(*) as total FROM profesores_informacion_completa 
      ${whereClause}
    `;

      // Parámetros para las consultas
      const dataParams = whereClause
        ? [...queryParamsArray, parseInt(limit), offset]
        : [parseInt(limit), offset];

      const countParams = whereClause ? queryParamsArray : [];

      // Ejecutar consultas en paralelo
      const [dataResult, countResult] = await Promise.all([
        client.query(dataQuery, dataParams),
        client.query(countQuery, countParams),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return FormatResponseModel.respuestaPostgres(
        {
          profesores: dataResult.rows,
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
   * @description Obtener todos los profesores de la base de datos
   * @param {Object} queryParams - Parámetros de consulta
   * @param {number} queryParams.page - Página actual (default: 1)
   * @param {number} queryParams.limit - Límite por página (default: 20)
   * @param {string} queryParams.sort_order - Campo para ordenar (default: nombres)
   * @param {string} queryParams.search - Término de búsqueda
   * @returns {Promise<Object>} Lista de profesores formateada
   */
  static async mostrarProfesoresEliminados(queryParams) {
    try {
      console.log("Query params: ", queryParams);
      const {
        page = 1,
        limit = 20,
        sort_order = "nombres",
        search = "",
        id_profesor = null,
      } = queryParams;

      // Si se proporciona un ID específico, buscar solo ese profesor
      if (id_profesor) {
        const specificQuery = `
        SELECT * FROM profesores_informacion_completa 
        WHERE id_profesor = $1
      `;

        const specificResult = await client.query(specificQuery, [id_profesor]);

        if (specificResult.rows.length === 0) {
          return FormatResponseModel.respuestaPostgres(
            { profesor: null },
            "Profesor no encontrado"
          );
        }

        return FormatResponseModel.respuestaPostgres(
          {
            profesor: specificResult.rows[0],
          },
          "Profesor obtenido exitosamente"
        );
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Ordenamiento simple
      const orderBy = `${sort_order} ASC`;

      // Consulta base SIN búsqueda primero para probar
      let dataQuery = `
      SELECT * FROM vista_profesores_eliminados 
      ORDER BY ${orderBy} 
      LIMIT $1 
      OFFSET $2
    `;

      let countQuery = `
      SELECT COUNT(*) as total FROM vista_profesores_eliminados 
    `;

      let dataParams = [parseInt(limit), offset];
      let countParams = [];

      // Solo agregar búsqueda si hay término
      if (search) {
        dataQuery = `
        SELECT * FROM vista_profesores_eliminados 
        WHERE (nombres ILIKE $1 OR apellidos ILIKE $2 OR cedula::text ILIKE $3)
        ORDER BY ${orderBy} 
        LIMIT $4 
        OFFSET $5
      `;

        countQuery = `
        SELECT COUNT(*) as total FROM vista_profesores_eliminados 
        WHERE (nombres ILIKE $1 OR apellidos ILIKE $2 OR cedula::text ILIKE $3)
      `;

        dataParams = [
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          parseInt(limit),
          offset,
        ];
        countParams = [`%${search}%`, `%${search}%`, `%${search}%`];
      }

      console.log("🔍 Ejecutando query:", dataQuery);
      console.log("🔍 Con parámetros:", dataParams);

      // Ejecutar consultas
      const [dataResult, countResult] = await Promise.all([
        client.query(dataQuery, dataParams),
        client.query(countQuery, countParams),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return FormatResponseModel.respuestaPostgres(
        {
          profesores: dataResult.rows,
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
   * @description Obtener todos los profesores de la base de datos
   * @returns {Promise<Object>} Lista de profesores formateada
   */
  static async mostrarDisponibilidad(id_profesor) {
    try {
      const { rows } = await client.query(
        "SELECT * FROM vista_disponibilidad_docente WHERE id_profesor = $1",
        [id_profesor]
      );

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Profesores obtenidos exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.mostrarDisponiblidad",
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
   * @method obtenerConFiltros
   * @description Obtener profesores con filtros específicos
   * @param {Object} filtros - Filtros de búsqueda
   * @returns {Promise<Object>} Lista de profesores filtrados formateada
   */
  static async obtenerConFiltros(filtros) {
    try {
      const { dedicacion, categoria, ubicacion, area, fecha, genero } = filtros;

      const query = "SELECT * FROM mostrar_profesor($1, $2, $3, $4, $5, $6)";
      const values = [dedicacion, categoria, ubicacion, area, fecha, genero];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Profesores filtrados obtenidos exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.obtenerConFiltros",
        filtros: filtros,
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
   * @description Buscar profesores por nombre, apellido o cédula
   * @param {string} busqueda - Término de búsqueda
   * @returns {Promise<Object>} Resultados de la búsqueda formateados
   */
  static async buscar(busqueda) {
    try {
      const query =
        "SELECT * FROM public.profesores_informacion_completa WHERE nombres ILIKE $1 OR apellidos ILIKE $2 OR cedula ILIKE $3";
      const values = [`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`];

      const { rows } = await client.query(query, values);
      return FormatResponseModel.respuestaPostgres(
        rows,
        "Búsqueda de profesores completada"
      );
    } catch (error) {
      error.details = {
        path: "ProfesorModel.buscar",
        busqueda: busqueda,
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
   * @description Obtener información de la imagen de un profesor
   * @param {number} idProfesor - ID del profesor
   * @returns {Promise<Object>} Información de la imagen formateada
   */
  static async obtenerImagen(idProfesor) {
    try {
      const query = "SELECT imagen FROM users WHERE cedula = $1";
      const values = [idProfesor];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Imagen del profesor obtenida"
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
   * @description Obtener todos los pregrados
   * @returns {Promise<Object>} Lista de pregrados formateada
   */
  static async obtenerPregrados() {
    try {
      const query =
        "SELECT id_pre_grado, nombre_pre_grado, tipo_pre_grado FROM pre_grado";
      const { rows } = await client.query(query);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Obtener todos los posgrados
   * @returns {Promise<Object>} Lista de posgrados formateada
   */
  static async obtenerPosgrados() {
    try {
      const query =
        "SELECT id_pos_grado, nombre_pos_grado, tipo_pos_grado FROM pos_grado";
      const { rows } = await client.query(query);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Obtener todas las áreas de conocimiento
   * @returns {Promise<Object>} Lista de áreas de conocimiento formateada
   */
  static async obtenerAreasConocimiento() {
    try {
      const query =
        "SELECT id_area_conocimiento, nombre_area_conocimiento FROM AREAS_DE_CONOCIMIENTO";
      const { rows } = await client.query(query);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Crear un nuevo pregrado
   * @param {Object} datos - Datos del pregrado
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async crearPregrado(datos, usuarioId) {
    try {
      const { nombre_pre_grado, tipo_pre_grado } = datos;

      const query = "CALL registrar_pre_grado($1, $2, $3, NULL)";
      const values = [usuarioId, nombre_pre_grado, tipo_pre_grado];

      const { rows } = await client.query(query, values);
      console.log(rows);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Crear un nuevo posgrado
   * @param {Object} datos - Datos del posgrado
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async crearPosgrado(datos, usuarioId) {
    try {
      const { nombre_pos_grado, tipo_pos_grado } = datos;

      const query = "CALL registrar_pos_grado($1, $2, $3, NULL)";
      const values = [usuarioId, nombre_pos_grado, tipo_pos_grado];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Crear una nueva área de conocimiento
   * @param {Object} datos - Datos del área de conocimiento
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async crearAreaConocimiento(datos, usuarioId) {
    try {
      const { area_conocimiento } = datos;

      const query = "CALL registrar_area_conocimiento($1, $2, NULL)";
      const values = [usuarioId, area_conocimiento];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Crear nueva disponibilidad docente
   * @param {number} id_profesor - ID del profesor
   * @param {Object} datos - Datos de la disponibilidad
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async crearDisponibilidad(id_profesor, datos, usuarioId) {
    try {
      const { dia_semana, hora_inicio, hora_fin } = datos;

      const query =
        "CALL registrar_disponibilidad_docente_completo($1, $2, $3, $4, $5, NULL)";
      const values = [
        usuarioId,
        id_profesor,
        dia_semana,
        hora_inicio,
        hora_fin,
      ];
      console.log("📝 Ejecutando query crear disponibilidad:", values);

      const { rows } = await client.query(query, values);

      console.log("✅ Resultado crear disponibilidad:", rows);
      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Actualizar disponibilidad docente existente
   * @param {number} id_disponibilidad - ID de la disponibilidad a actualizar
   * @param {Object} datos - Datos de la disponibilidad
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async actualizarDisponibilidad(id_disponibilidad, datos, usuarioId) {
    try {
      const { dia_semana, hora_inicio, hora_fin } = datos;

      // Validaciones básicas
      if (!dia_semana || !hora_inicio || !hora_fin) {
        throw new Error("Datos incompletos para actualizar disponibilidad");
      }

      const query =
        "CALL actualizar_disponibilidad_docente($1, $2, $3, $4, $5, NULL)";
      const values = [
        usuarioId,
        id_disponibilidad,
        dia_semana,
        hora_inicio,
        hora_fin,
      ];

      console.log("📝 Ejecutando query actualizar disponibilidad:", values);

      // Ejecutar el procedimiento almacenado
      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Eliminar disponibilidad docente
   * @param {number} id_disponibilidad - ID de la disponibilidad a eliminar
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async eliminarDisponibilidad(id_disponibilidad, usuarioId) {
    try {
      const query = "CALL eliminar_disponibilidad_docente($1, $2, NULL)";
      const values = [usuarioId, id_disponibilidad];

      console.log("📝 Ejecutando query eliminar disponibilidad:", values);

      // Ejecutar el procedimiento almacenado
      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Actualizar un profesor existente
   * @param {Object} datos - Datos actualizados
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
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

      const query = `CALL actualizar_profesor_completo_o_parcial(
        NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )`;
      const values = [
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
      ];
      console.log(datos);
      const { rows } = await client.query(query, values);
      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Eliminar/destituir un profesor
   * @param {Object} datos - Datos de la eliminación
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async eliminar(datos, usuarioId) {
    try {
      const { id_usuario, tipo_accion, razon, observaciones, fecha_efectiva } =
        datos;

      const query =
        "CALL eliminar_destituir_profesor(NULL, $1, $2, $3, $4, $5, $6)";
      const values = [
        usuarioId,
        id_usuario,
        tipo_accion,
        razon,
        observaciones,
        fecha_efectiva,
      ];
      console.log(values, datos);

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
   * @description Reingresar/habilitar un profesor previamente eliminado
   * @param {Object} datos - Datos del reingreso
   * @param {number} usuarioId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
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

      const query =
        "CALL reingresar_profesor(NULL, $1, $2, $3, $4, $5, $6, $7)";
      const values = [
        usuarioId,
        id_usuario,
        tipo_reingreso,
        motivo_reingreso,
        observaciones,
        fecha_efectiva,
        registro_anterior_id,
      ];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
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
