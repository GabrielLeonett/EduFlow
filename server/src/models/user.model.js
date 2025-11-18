/*
Importación de la clase para el formateo de los datos que se reciben de la BD y
su procesamiento para devolver al controlador un resultado estandarizado.
*/
import FormatResponseModel from "../utils/FormatterResponseModel.js";

// Importación de la conexión con la base de datos
import client from "../database/pg.js";

/**
 * @class UserModel
 * @description Esta clase se encarga exclusivamente de interactuar con la base de datos.
 * Solo contiene operaciones CRUD y consultas directas a la BD.
 */
export default class UserModel {
  /**
   * @static
   * @async
   * @method loginUser
   * @description Busca un usuario en la base de datos por su email
   * @param {string} email - Email del usuario a buscar
   * @returns {Promise<Object>} Resultado de la consulta a la base de datos
   */
  static async loginUser(email) {
    try {
      // Opción 1: Si usas parámetros nombrados con :
      const query = "SELECT iniciar_session($1) AS p_resultado";

      const { rows } = await client.query(query, [email]);

      return FormatResponseModel.respuestaPostgres(rows, "Usuario Obtenido");
    } catch (error) {
      error.details = {
        path: "UserModel.loginUser",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario"
      );
    }
  }

  /**
   * @static
   * @async
   * @method cambiarContraseña
   * @description Actualiza la contraseña de un usuario en la base de datos
   * @param {number} usuarioId - ID del usuario
   * @param {string} passwordHash - Contraseña hasheada
   * @returns {Promise<Object>} Resultado de la operación en la base de datos
   */
  static async cambiarContraseña(usuarioId, passwordHash) {
    try {
      const query = "CALL actualizar_contrasena_usuario($1, $2, NULL)";
      const values = [usuarioId, passwordHash];

      const result = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        result.rows,
        "Contraseña actualizada exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "UserModel.cambiarContraseña",
        usuario_id: usuarioId,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al cambiar la contraseña"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerUsuarioPorId
   * @description Obtiene un usuario por su ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  static async obtenerUsuarioPorId(id) {
    try {
      const query = "SELECT * FROM users WHERE cedula = $1";
      const values = [id];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(rows, "Usuario obtenido");
    } catch (error) {
      error.details = {
        path: "UserModel.obtenerUsuarioPorId",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerUsuarioPorEmail
   * @description Obtiene un usuario por su ID
   * @param {number} correo - Correo del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  static async obtenerUsuarioPorEmail(correo) {
    try {
      const query = "SELECT * FROM users WHERE email = $1";
      const values = [correo];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(rows, "Usuario obtenido");
    } catch (error) {
      error.details = {
        path: "UserModel.obtenerUsuarioPorId",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario"
      );
    }
  }

  /**
   * @static
   * @async
   * @method GuardarTokenEmail
   * @description Actualiza el token de recuperación con expiración
   * @param {string} correo - correo del usuario
   * @param {string} token - token hasheado
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async GuardarTokenEmail(correo, token) {
    try {
      const query = `
      UPDATE users 
      SET 
        reset_password_token = $1, 
        reset_password_expires = NOW() + INTERVAL '1 hour'
      WHERE email = $2
      RETURNING cedula, email
    `;
      const values = [token, correo];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(rows, "Token actualizado");
    } catch (error) {
      error.details = { path: "UserModel.EnviarTokenEmail" };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al actualizar el token"
      );
    }
  }

  /**
   * @static
   * @async
   * @method obtenerUsuarioPorEmailConToken
   * @description Obtiene usuario por email con token no expirado
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} Datos del usuario con token
   */
  static async obtenerUsuarioPorEmailConToken(email) {
    try {
      const query = `
      SELECT cedula, email, nombres, reset_password_token, reset_password_expires
      FROM users 
      WHERE email = $1 
        AND reset_password_token IS NOT NULL
        AND reset_password_expires > NOW()
    `;
      const values = [email];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Usuario obtenido por token"
      );
    } catch (error) {
      error.details = { path: "UserModel.obtenerUsuarioPorToken" };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al obtener el usuario por token"
      );
    }
  }
  /**
   * @static
   * @async
   * @method actualizarContraseñaYLimpiarToken
   * @description Actualiza la contraseña y limpia los campos de recuperación
   * @param {string} email - Email del usuario
   * @param {string} nuevaPasswordHash - Nueva contraseña hasheada
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizarContraseñaYLimpiarToken(email, nuevaPasswordHash) {
    try {
      console.log(
        "🔍 [actualizarContraseñaYLimpiarToken] Actualizando contraseña y limpiando token..."
      );

      const query = `
      UPDATE users 
      SET 
        password = $1,
        reset_password_token = NULL,
        reset_password_expires = NULL,
        updated_at = NOW()
      WHERE email = $2
      RETURNING cedula, email, nombres, apellidos
    `;
      const values = [nuevaPasswordHash, email];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Contraseña actualizada exitosamente"
      );
    } catch (error) {
      console.error("💥 Error en actualizarContraseñaYLimpiarToken:", error);
      error.details = {
        path: "UserModel.actualizarContraseñaYLimpiarToken",
        email: email,
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al actualizar la contraseña y limpiar el token"
      );
    }
  }

  /**
   * @static
   * @async
   * @method desactivarUsuario
   * @description Desactiva un usuario
   * @param {number} usuario_accion - ID del usuario que realiza la acción
   * @param {number} id_usuario - ID del usuario a desactivar
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async desactivarUsuario(usuario_accion, id_usuario) {
    try {
      const query = ` CALL desactivar_usuario($1, $2, NULL)`;
      const values = [id_usuario, usuario_accion];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Usuario desactivado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "UserModel.desactivarUsuarioDirecto",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al desactivar usuario"
      );
    }
  }

  /**
   * @static
   * @async
   * @method activarUsuario
   * @description Activa un usuario
   * @param {number} usuario_accion - ID del usuario que realiza la acción
   * @param {number} id_usuario - ID del usuario a activar
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async activarUsuario(usuario_accion, id_usuario) {
    try {
      const query = ` CALL activar_usuario($1, $2, NULL)`;
      const values = [id_usuario, usuario_accion];

      const { rows } = await client.query(query, values);

      return FormatResponseModel.respuestaPostgres(
        rows,
        "Usuario activado exitosamente"
      );
    } catch (error) {
      error.details = {
        path: "UserModel.activarUsuario",
      };
      throw FormatResponseModel.respuestaError(
        error,
        "Error al activar usuario"
      );
    }
  }
}
