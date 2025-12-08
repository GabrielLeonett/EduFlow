/*
 * Importación de la clase para el formateo de los datos que se reciben de la BD y
 * su procesamiento para devolver al controlador un resultado estandarizado.
 */
import FormatResponseModel from "../utils/FormatterResponseModel.js";

// Importación de la conexión con la base de datos
import db from "../database/db.js";

/**
 * Modelo de datos para la entidad Usuario.
 * Esta clase se encarga exclusivamente de interactuar con la base de datos.
 * Contiene operaciones CRUD y consultas directas a la BD siguiendo el patrón Active Record.
 * 
 * @module models/user.model
 * @class UserModel
 * @requires ../utils/FormatterResponseModel
 * @requires ../database/pg
 * @implements {DataAccessObject} Patrón DAO para acceso a datos
 */
export default class UserModel {
  /**
   * Tipos de datos para operaciones del modelo.
   * @typedef {Object} QueryResult
   * @property {Array} rows - Filas resultantes de la consulta
   * @property {number} rowCount - Número de filas afectadas/retornadas
   */

  /**
   * Datos de usuario retornados por las consultas.
   * @typedef {Object} UsuarioDB
   * @property {number} cedula - Identificación única del usuario (PK)
   * @property {string} email - Correo electrónico único
   * @property {string} nombres - Nombres del usuario
   * @property {string} apellidos - Apellidos del usuario
   * @property {string} password - Contraseña hasheada (solo para operaciones internas)
   * @property {Array} roles - Roles asignados al usuario
   * @property {boolean} primera_vez - Indica si es primer acceso del usuario
   * @property {number} [id_pnf] - ID del PNF (Programa Nacional de Formación) asociado (opcional)
   * @property {string} [reset_password_token] - Token de recuperación hasheado (opcional)
   * @property {Date} [reset_password_expires] - Fecha de expiración del token (opcional)
   * @property {Date} created_at - Fecha de creación del registro
   * @property {Date} updated_at - Fecha de última actualización
   */

  /**
   * Inicia el proceso de autenticación mediante una función almacenada en PostgreSQL.
   * Utiliza una función de base de datos (`iniciar_session`) que maneja lógica compleja
   * como verificación de estado, registro de intentos y retorno de datos del usuario.
   * 
   * @static
   * @async
   * @method loginUser
   * @memberof UserModel
   * @param {string} email - Email del usuario a buscar (formato: usuario@dominio.com)
   * @returns {Promise<Object>} Objeto estandarizado con el resultado de la consulta
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @example
   * // Uso típico
   * const resultado = await UserModel.loginUser("usuario@ejemplo.com");
   * // resultado = {
   * //   success: true,
   * //   message: "Usuario Obtenido",
   * //   data: { ...datos_usuario }
   * // }
   */
  static async loginUser(email) {
    try {
      // Función almacenada que maneja lógica de autenticación compleja
      const query = "SELECT iniciar_session(?) AS p_resultado";
      
      // Ejecutar consulta parametrizada (previene SQL injection)
      const { rows } = await db.raw(query, [email]);

      // Formatear respuesta según el estándar definido
      return FormatResponseModel.respuestaPostgres(rows, "Usuario Obtenido");
    } catch (error) {
      // Enriquecer el error con contexto para mejor trazabilidad
      error.details = {
        path: "UserModel.loginUser",
        email: email.substring(0, 3) + "***", // Log parcial por privacidad
        operation: "authentication_query"
      };
      
      // Lanzar error formateado para manejo consistente
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario"
      );
    }
  }

  /**
   * Actualiza la contraseña de un usuario existente en el sistema.
   * Utiliza un procedimiento almacenado que valida permisos y realiza auditoría.
   * 
   * @static
   * @async
   * @method cambiarContraseña
   * @memberof UserModel
   * @param {number|string} usuarioId - Identificador único del usuario
   * @param {string} passwordHash - Contraseña hasheada con algoritmo seguro (bcrypt/scrypt)
   * @returns {Promise<Object>} Resultado estandarizado de la operación
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @security Asegura que solo usuarios autenticados puedan cambiar su propia contraseña
   */
  static async cambiarContraseña(usuarioId, passwordHash) {
    try {
      // Procedimiento almacenado para cambio de contraseña con validaciones
      const query = "CALL actualizar_contrasena_usuario(?,  ?, NULL)";
      const values = [usuarioId, passwordHash];

      const result = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(
        result.rows,
        "Contraseña actualizada exitosamente"
      );
    } catch (error) {
      // Contextualizar error para auditoría
      error.details = {
        path: "UserModel.cambiarContraseña",
        usuario_id: usuarioId,
        operation: "password_update",
        error_code: error.code // Código de error PostgreSQL
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al cambiar la contraseña"
      );
    }
  }

  /**
   * Obtiene la información completa de un usuario mediante su ID.
   * Utiliza una vista materializada (`vista_usuarios`) para un acceso optimizado.
   * 
   * @static
   * @async
   * @method obtenerUsuarioPorId
   * @memberof UserModel
   * @param {number|string} id - Identificador único del usuario (cedula en este contexto)
   * @returns {Promise<Object>} Datos del usuario en formato estandarizado
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @note La vista `vista_usuarios` debe incluir todos los campos necesarios para perfiles
   */
  static async obtenerUsuarioPorId(id) {
    try {
      // Consulta optimizada mediante vista materializada
      const query = "SELECT * FROM vista_usuarios WHERE cedula =?";
      const values = [id];

      const { rows } = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(rows, "Usuario obtenido");
    } catch (error) {
      error.details = {
        path: "UserModel.obtenerUsuarioPorId",
        user_id: id,
        operation: "user_retrieval_by_id"
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario"
      );
    }
  }

  /**
   * Obtiene la información de un usuario mediante su email.
   * Utilizado para operaciones de recuperación y verificación de unicidad.
   * 
   * @static
   * @async
   * @method obtenerUsuarioPorEmail
   * @memberof UserModel
   * @param {string} correo - Dirección de correo electrónico del usuario
   * @returns {Promise<Object>} Datos del usuario en formato estandarizado
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   */
  static async obtenerUsuarioPorEmail(correo) {
    try {
      const query = "SELECT * FROM vista_usuarios WHERE email =?";
      const values = [correo];

      const { rows } = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(rows, "Usuario obtenido");
    } catch (error) {
      error.details = {
        path: "UserModel.obtenerUsuarioPorEmail",
        email: correo.substring(0, 3) + "***", // Log parcial por privacidad
        operation: "user_retrieval_by_email"
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario"
      );
    }
  }

  /**
   * Almacena un token de recuperación de contraseña con tiempo de expiración.
   * El token se almacena hasheado y con una validez de 1 hora por defecto.
   * 
   * @static
   * @async
   * @method GuardarTokenEmail
   * @memberof UserModel
   * @param {string} correo - Email del usuario que solicita recuperación
   * @param {string} token - Token hasheado con algoritmo seguro (bcrypt)
   * @returns {Promise<Object>} Resultado de la operación de actualización
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @security Los tokens se almacenan hasheados para prevenir acceso a datos sensibles
   */
  static async GuardarTokenEmail(correo, token) {
    try {
      const query = `
      UPDATE users 
      SET 
        reset_password_token = ?, 
        reset_password_expires = NOW() + INTERVAL '1 hour'
      WHERE email =?
      RETURNING cedula, email
    `;
      const values = [token, correo];

      const { rows } = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(rows, "Token actualizado");
    } catch (error) {
      error.details = { 
        path: "UserModel.GuardarTokenEmail",
        operation: "recovery_token_storage",
        error_type: error.code
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al actualizar el token"
      );
    }
  }

  /**
   * Obtiene un usuario que tenga un token de recuperación válido (no expirado).
   * Utilizado en el flujo de verificación de tokens de recuperación.
   * 
   * @static
   * @async
   * @method obtenerUsuarioPorEmailConToken
   * @memberof UserModel
   * @param {string} email - Email del usuario que solicitó recuperación
   * @returns {Promise<Object>} Datos del usuario incluyendo token y expiración
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @note La consulta verifica que el token no haya expirado (`reset_password_expires > NOW()`)
   */
  static async obtenerUsuarioPorEmailConToken(email) {
    try {
      const query = `
      SELECT cedula, email, nombres, reset_password_token, reset_password_expires
      FROM users 
      WHERE email = ?'
        AND reset_password_token IS NOT NULL
        AND reset_password_expires > NOW()
    `;
      const values = [email];

      const { rows } = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Usuario obtenido por token"
      );
    } catch (error) {
      error.details = { 
        path: "UserModel.obtenerUsuarioPorEmailConToken",
        operation: "token_validation_query",
        email: email.substring(0, 3) + "***"
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario por token"
      );
    }
  }

  /**
   * Actualiza la contraseña de un usuario y limpia los campos de recuperación.
   * Operación atómica que asegura consistencia en el proceso de recuperación.
   * 
   * @static
   * @async
   * @method actualizarContraseñaYLimpiarToken
   * @memberof UserModel
   * @param {string} email - Email del usuario
   * @param {string} nuevaPasswordHash - Nueva contraseña hasheada
   * @returns {Promise<Object>} Resultado de la operación atómica
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @performance Operación atómica que previene estados inconsistentes
   */
  static async actualizarContraseñaYLimpiarToken(email, nuevaPasswordHash) {
    try {
      console.log(
        "🔍 [actualizarContraseñaYLimpiarToken] Actualizando contraseña y limpiando token..."
      );

      const query = `
      UPDATE users 
      SET 
        password = ?,
        reset_password_token = NULL,
        reset_password_expires = NULL,
        updated_at = NOW()
      WHERE email =?
      RETURNING cedula, email, nombres, apellidos
    `;
      const values = [nuevaPasswordHash, email];

      const { rows } = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Contraseña actualizada exitosamente"
      );
    } catch (error) {
      console.error("💥 Error en actualizarContraseñaYLimpiarToken:", error);
      
      error.details = {
        path: "UserModel.actualizarContraseñaYLimpiarToken",
        email: email.substring(0, 3) + "***",
        operation: "password_reset_and_token_cleanup",
        error_code: error.code
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al actualizar la contraseña y limpiar el token"
      );
    }
  }

  /**
   * Desactiva un usuario en el sistema mediante un procedimiento almacenado.
   * Realiza un soft delete (cambio de estado) en lugar de eliminación física.
   * 
   * @static
   * @async
   * @method desactivarUsuario
   * @memberof UserModel
   * @param {number|string} usuario_accion - ID del administrador que ejecuta la acción
   * @param {number|string} id_usuario - ID del usuario a desactivar
   * @returns {Promise<Object>} Resultado de la operación de desactivación
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @security Solo accesible por usuarios con roles SuperAdmin o Vicerrector
   * @note Utiliza procedimiento almacenado para mantener integridad referencial
   */
  static async desactivarUsuario(usuario_accion, id_usuario) {
    try {
      const query = ` CALL desactivar_usuario(?,  ?, NULL)`;
      const values = [id_usuario, usuario_accion];

      const { rows } = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Usuario desactivado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "UserModel.desactivarUsuario",
        admin_id: usuario_accion,
        user_id: id_usuario,
        operation: "user_deactivation",
        constraint: error.constraint // Información de restricción violada
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al desactivar usuario"
      );
    }
  }

  /**
   * Reactiva un usuario previamente desactivado en el sistema.
   * Restaura el acceso del usuario manteniendo su historial y relaciones.
   * 
   * @static
   * @async
   * @method activarUsuario
   * @memberof UserModel
   * @param {number|string} usuario_accion - ID del administrador que ejecuta la acción
   * @param {number|string} id_usuario - ID del usuario a reactivar
   * @returns {Promise<Object>} Resultado de la operación de reactivación
   * @throws {Object} Error formateado en caso de fallo en la base de datos
   * 
   * @security Solo accesible por usuarios con roles SuperAdmin o Vicerrector
   */
  static async activarUsuario(usuario_accion, id_usuario) {
    try {
      const query = ` CALL activar_usuario(?,  ?, NULL)`;
      const values = [id_usuario, usuario_accion];

      const { rows } = await db.raw(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Usuario activado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "UserModel.activarUsuario",
        admin_id: usuario_accion,
        user_id: id_usuario,
        operation: "user_activation",
        error_type: error.code
      };
      
      throw FormatResponseModel.respuestaError(
        error,
        "Error al activar usuario"
      );
    }
  }
}