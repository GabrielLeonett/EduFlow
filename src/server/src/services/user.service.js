import ValidationService from "./validation.service.js";
import EmailService from "./email.service.js";
import UserModel from "../models/user.model.js";
import SocketServices from "./socket.service.js";
import {
  comparePassword,
  generarPassword,
  hashPassword,
} from "../utils/encrypted.js";
import JWTService from "./jsonWebToken.service.js";
import { asegurarStringEnMinusculas } from "../utils/utilis.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";

/**
 * Servicio de negocio para operaciones relacionadas con usuarios.
 * Contiene la lógica de negocio para autenticación, gestión de usuarios,
 * recuperación de contraseña y administración de cuentas.
 *
 * @module services/user.service
 * @class UserService
 * @requires ./validation.service
 * @requires ./email.service
 * @requires ../models/user.model
 * @requires ./socket.service
 * @requires ../utils/encrypted
 * @requires ../utils/auth
 * @requires ../utils/utilis
 * @requires ../utils/FormatterResponseService
 */
export default class UserService {
  /**
   * Tipos de datos para operaciones de autenticación.
   * @typedef {Object} LoginData
   * @property {string} email - Correo electrónico del usuario
   * @property {string} password - Contraseña del usuario
   */

  /**
   * Tipos de datos para recuperación de contraseña.
   * @typedef {Object} RecoveryData
   * @property {string} email - Correo electrónico para recuperación
   * @property {string} [token] - Token de recuperación (opcional)
   * @property {string} [password] - Nueva contraseña (opcional)
   */

  /**
   * Estructura de respuesta estándar del servicio.
   * @typedef {Object} ServiceResponse
   * @property {boolean} success - Indica si la operación fue exitosa
   * @property {string} message - Mensaje descriptivo del resultado
   * @property {Object} [data] - Datos de respuesta en caso de éxito
   * @property {Object} [error] - Información de error en caso de fallo
   * @property {string} [error.code] - Código único del error
   * @property {number} [status] - Código HTTP de la respuesta
   */

  /**
   * Inicia sesión de un usuario en el sistema.
   * Valida credenciales, verifica contraseña, genera token JWT y establece sesión.
   *
   * @static
   * @async
   * @method login
   * @memberof UserService
   * @param {LoginData} datos - Objeto con email y contraseña del usuario
   * @param {Object|null} usuario - Usuario pre-autenticado (si middleware ya validó)
   * @returns {Promise<ServiceResponse>} Respuesta estandarizada del servicio
   * @throws {Error} Cuando ocurre un error interno no controlado
   *
   * @example
   * // Uso típico
   * const resultado = await UserService.login({
   *   email: "usuario@ejemplo.com",
   *   password: "contraseñaSegura123"
   * }, null);
   */
  static async login(datos, usuario) {
    try {
      console.log("🔍 [login] Iniciando proceso de login...");

      // Validar que no haya sesión previa activa
      if (usuario) {
        throw FormatterResponseService.error(
          "Ya hay una sesion iniciada",
          "No se puede crear una sesion si ya existe una",
          404
        );
      }

      // 1. Validar estructura de datos de entrada
      const validacion = ValidationService.validateLogin(datos);
      if (!validacion.isValid) {
        console.error("❌ Validación de login fallida:", validacion.errors);
        return FormatterResponseService.validationError(
          validacion.errors,
          "Error de validación en login"
        );
      }

      // 2. Normalizar y buscar usuario en la base de datos
      const email = asegurarStringEnMinusculas(datos.email);
      console.log("📧 Buscando usuario:", email);

      const respuestaModel = await UserModel.loginUser(email);

      // Si el modelo ya retorna un formato de error, lo propagamos
      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo login:", respuestaModel);
        return respuestaModel;
      }

      const user = respuestaModel.data;
      console.log("✅ Usuario encontrado:", user.nombres, user.apellidos);

      // 3. Validar contraseña mediante comparación segura
      console.log("🔐 Validando contraseña...");
      const validatePassword = await comparePassword(
        datos.password,
        user.password
      );

      if (!validatePassword) {
        console.error("❌ Contraseña inválida para usuario:", email);
        throw FormatterResponseService.unauthorized(
          "Correo o contraseña inválida"
        );
      }

      // 4. Crear token de sesión JWT
      console.log("🎫 Creando token de sesión...");
      const token = JWTService.createSession({
        id: user.id,
        apellidos: user.apellidos,
        nombres: user.nombres,
        roles: user.roles,
        ...(user.id_pnf && { id_pnf: user.id_pnf }), // Propiedad condicional
      });

      console.log(
        "✅ Login exitoso para usuario:",
        user.nombres,
        user.apellidos,
      );

      // 5. Preparar respuesta exitosa con datos del usuario
      return FormatterResponseService.success(
        {
          tokens: token,
          user: {
            id: user.id,
            apellidos: user.apellidos,
            nombres: user.nombres,
            primera_vez: user.primera_vez,
            roles: user.roles,
            ...(user.id_pnf && { id_pnf: user.id_pnf }),
          },
        },
        "Inicio de sesión exitoso",
        {
          status: 200,
          title: "Login Exitoso",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio login:", error);
      throw error; // Propagar error para manejo en capa superior
    }
  }

  /**
   * Envía un token de recuperación al email del usuario.
   * Genera un token seguro, lo almacena con expiración y envía email con instrucciones.
   *
   * @static
   * @async
   * @method EnviarTokenEmail
   * @memberof UserService
   * @param {RecoveryData} datos - Objeto con email para recuperación
   * @returns {Promise<ServiceResponse>} Respuesta estandarizada del servicio
   * @throws {Error} Cuando ocurre un error en el envío del email o en la base de datos
   *
   * @security Esta operación no revela si un email existe en el sistema por seguridad
   */
  static async EnviarTokenEmail(datos) {
    try {
      console.log("🔍 [EnviarTokenEmail] Iniciando envío de token...");

      // 1. Validar email proporcionado
      const validacion = ValidationService.validatePartialLogin(datos);
      if (!validacion.isValid) {
        console.error("❌ Validación de email fallida:", validacion.errors);
        return FormatterResponseService.validationError(
          validacion.errors,
          "Error de validación del correo"
        );
      }

      // 2. Verificar existencia del usuario (sin revelar si existe o no)
      const respuestaModel = await UserModel.obtenerUsuarioPorEmail(
        datos.email
      );

      // Por seguridad, siempre retornamos éxito aunque el email no exista
      if (respuestaModel.state != "success") {
        console.log("❌ Usuario no encontrado:", datos.email);
        return FormatterResponseService.success(
          null,
          "Si el email existe, se ha enviado el token de recuperación",
          { status: 200, title: "Token Enviado" }
        );
      }

      const usuario = respuestaModel.data[0];

      // 3. Generar token seguro (16 caracteres) y su hash para almacenamiento
      const tokenPlano = await generarPassword(16);
      const token_hash = await hashPassword(tokenPlano);

      // 4. Guardar token hash con tiempo de expiración (1 hora por defecto)
      await UserModel.GuardarTokenEmail(datos.email, token_hash);

      // 5. Construir URL para restablecimiento con parámetros codificados
      const resetUrl = `${
        process.env.ORIGIN_FRONTEND
      }/recuperar-contrasena?email=${encodeURIComponent(
        datos.email
      )}&token=${encodeURIComponent(tokenPlano)}`;

      // 6. Preparar contenido del email con diseño responsivo
      const correo = {
        asunto: "Recuperación de Contraseña - Sistema Académico",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #2c3e50;">Recuperación de Contraseña</h2>
          <p>Hola ${usuario.nombres || "usuario"},</p>
          <p>Has solicitado recuperar tu contraseña. Utiliza el siguiente token:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 0;">${tokenPlano}</p>
          </div>
          <p><strong>Instrucciones:</strong></p>
          <ul>
            <li>Este token expira en 1 hora</li>
            <li>Copia y pega el token en la plataforma O haz clic en el botón</li>
            <li>Si no solicitaste este token, ignora este mensaje</li>
          </ul>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" 
              style="display: inline-block; background-color: #1C75BA; color: white; 
                    padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                    font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
            Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
            ${resetUrl}
          </p>
        </div>
        `,
      };

      // 7. Enviar email utilizando el servicio de email
      const emailService = new EmailService();
      const resultadoEmail = await emailService.enviarEmail({
        Destinatario: datos.email,
        Correo: correo,
        verificarEmail: false, // No verificar existencia del email para evitar información
      });

      if (!resultadoEmail.success) {
        console.error("❌ Error al enviar email:", resultadoEmail.error);
        return FormatterResponseService.error(
          "Error al enviar el correo electrónico",
          { status: 500, title: "Error de envío" }
        );
      }

      console.log("✅ Token enviado exitosamente a:", datos.email);
      return FormatterResponseService.success(
        null,
        "Si el email existe, se ha enviado el token de recuperación",
        { status: 200, title: "Token Enviado" }
      );
    } catch (error) {
      console.error("💥 Error en servicio EnviarTokenEmail:", error);
      throw error;
    }
  }

  /**
   * Verifica la validez de un token de recuperación de contraseña.
   * Comprueba existencia, expiración y coincidencia del token.
   *
   * @static
   * @async
   * @method VerificarToken
   * @memberof UserService
   * @param {string} email - Email del usuario que solicitó recuperación
   * @param {string} token - Token proporcionado por el usuario (sin hash)
   * @returns {Promise<ServiceResponse>} Respuesta con estado de verificación
   * @throws {Error} Cuando ocurre un error en la base de datos
   */
  static async VerificarToken(email, token) {
    try {
      console.log("🔍 [VerificarToken] Verificando token...");

      // 1. Buscar usuario con token válido (no expirado)
      const respuestaModel = await UserModel.obtenerUsuarioPorEmailConToken(
        email
      );

      if (respuestaModel.state != "success") {
        console.log("❌ Usuario no encontrado o sin token válido:", email);
        return FormatterResponseService.error("Token inválido o expirado", {
          status: 400,
          title: "Token Inválido",
        });
      }

      const usuario = respuestaModel.data[0];

      // 2. Verificar expiración del token (comparación de fechas)
      const ahora = new Date();
      const expiracion = new Date(usuario.reset_password_expires);

      if (ahora > expiracion) {
        console.log("❌ Token expirado para:", email);
        return FormatterResponseService.error("Token expirado", {
          status: 400,
          title: "Token Expirado",
        });
      }

      // 3. Comparar token proporcionado con hash almacenado
      const tokenValido = await comparePassword(
        token,
        usuario.reset_password_token
      );

      if (!tokenValido) {
        console.log("❌ Token no coincide para:", email);
        return FormatterResponseService.error("Token inválido", {
          status: 400,
          title: "Token Inválido",
        });
      }

      console.log("✅ Token verificado exitosamente para:", email);
      return FormatterResponseService.success(
        {
          email: usuario.email,
          nombres: usuario.nombres,
          tokenValido: true,
        },
        "Token verificado correctamente",
        { status: 200, title: "Token Válido" }
      );
    } catch (error) {
      console.error("💥 Error en servicio VerificarToken:", error);
      throw error;
    }
  }

  /**
   * Cambia la contraseña del usuario mediante dos flujos posibles:
   * 1. Usuario autenticado (requiere contraseña actual)
   * 2. Recuperación con token (requiere token válido)
   *
   * @static
   * @async
   * @method cambiarContraseña
   * @memberof UserService
   * @param {Object} datos - Datos para el cambio de contraseña
   * @param {string} [datos.antigua_password] - Contraseña actual (solo para usuarios autenticados)
   * @param {string} datos.password - Nueva contraseña
   * @param {string} [datos.email] - Email para recuperación
   * @param {string} [datos.token] - Token de recuperación
   * @param {Object|null} usuarioActual - Usuario autenticado (null para recuperación)
   * @returns {Promise<ServiceResponse>} Respuesta del cambio de contraseña
   * @throws {Error} Cuando ocurre un error en la validación o base de datos
   */
  static async cambiarContraseña(datos, usuarioActual = null) {
    try {
      console.log("🔍 [cambiarContraseña] Iniciando cambio de contraseña...");

      const modo = usuarioActual
        ? "USUARIO_AUTENTICADO"
        : "RECUPERACION_CON_TOKEN";
      console.log("📝 Modo:", modo);

      // 1. Validar datos según el modo de operación
      let validacion;
      if (usuarioActual) {
        // Modo usuario autenticado - valida contraseña actual y nueva
        validacion = ValidationService.validateContrasenia(datos);
      } else {
        // Modo recuperación - valida email, token y nueva contraseña
        validacion = ValidationService.validateRecoveryPassword(datos);
      }

      if (!validacion.isValid) {
        console.error(
          "❌ Validación de contraseña fallida:",
          validacion.errors
        );
        return FormatterResponseService.validationError(
          validacion.errors,
          "Error de validación en cambio de contraseña"
        );
      }
      console.log("✅ Validación de datos exitosa.");

      let usuarioParaCambio;

      // 2. Lógica específica por modo de operación
      if (usuarioActual) {
        // 🔐 MODO USUARIO AUTENTICADO
        console.log("🔐 Modo: Usuario autenticado");

        // Obtener usuario para validar contraseña actual
        const respuestaUsuario = await UserModel.obtenerUsuarioPorId(
          usuarioActual.id
        );

        if (!respuestaUsuario.data || respuestaUsuario.data.length === 0) {
          console.error("❌ Usuario no encontrado:", usuarioActual.id);
          return FormatterResponseService.notFound("Usuario no encontrado");
        }

        usuarioParaCambio = respuestaUsuario.data[0];
        const { password } = usuarioParaCambio;

        // Validar contraseña actual
        console.log("🔐 Validando contraseña actual...");
        const validatePassword = await comparePassword(
          datos.antigua_password,
          password
        );

        if (!validatePassword) {
          console.error(
            "❌ Contraseña actual incorrecta para usuario:",
            usuarioActual.id
          );
          return FormatterResponseService.unauthorized(
            "La contraseña actual es incorrecta"
          );
        }
      } else {
        // 🔑 MODO RECUPERACIÓN CON TOKEN
        console.log("🔑 Modo: Recuperación con token");

        // Verificar validez del token antes de proceder
        const { email, token } = datos;
        console.log("🔍 Verificando token de recuperación...");

        const tokenVerificado = await this.VerificarToken(email, token);
        if (!tokenVerificado.success) {
          return tokenVerificado; // Retornar error de verificación
        }
      }

      // 3. Hashear nueva contraseña (común para ambos modos)
      console.log("🔒 Hasheando nueva contraseña...");
      const passwordHash = await hashPassword(datos.password);

      // 4. Actualizar contraseña en base de datos según modo
      console.log("💾 Actualizando contraseña en base de datos...");

      let respuestaModel;
      if (usuarioActual) {
        // Modo autenticado - actualizar contraseña normalmente
        respuestaModel = await UserModel.cambiarContraseña(
          usuarioActual.id,
          passwordHash
        );
      } else {
        // Modo recuperación - actualizar contraseña y limpiar token usado
        respuestaModel = await UserModel.actualizarContraseñaYLimpiarToken(
          datos.email,
          passwordHash
        );
      }

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo cambiar contraseña:", respuestaModel);
        return respuestaModel;
      }

      console.log("✅ Contraseña cambiada exitosamente");

      // 5. Preparar respuesta según modo
      const mensajeExito = usuarioActual
        ? "Contraseña cambiada exitosamente"
        : "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña";

      return FormatterResponseService.success(null, mensajeExito, {
        status: 200,
        title: usuarioActual
          ? "Contraseña Actualizada"
          : "Contraseña Restablecida",
      });
    } catch (error) {
      console.error("💥 Error en servicio cambiar contraseña:", error);

      if (error.name === "ValidationError") {
        return FormatterResponseService.validationError(
          error.details || [],
          error.message
        );
      }

      throw error;
    }
  }

  /**
   * Verifica la sesión actual de un usuario autenticado.
   * Retorna los datos del usuario si la sesión es válida.
   *
   * @static
   * @async
   * @method verificarSesion
   * @memberof UserService
   * @param {Object} user - Objeto de usuario inyectado por middleware de autenticación
   * @returns {Promise<ServiceResponse>} Respuesta con datos de sesión verificada
   * @throws {Error} Cuando no hay usuario autenticado
   */
  static async verificarSesion(user) {
    try {
      // Validar existencia de usuario autenticado
      if (!user) {
        FormatterResponseService.unauthorized("Usuario no autenticado");
      }

      return FormatterResponseService.success(
        user,
        "Sesión verificada exitosamente",
        {
          status: 200,
          title: "Sesión Activa",
          verifiedAt: new Date().toISOString(),
          userStatus: "active",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio verificar sesión:", error);

      // Manejar errores específicos de conexión
      if (["ECONNREFUSED", "ETIMEDOUT"].includes(error.code)) {
        return FormatterResponseService.error(
          "Error de conexión con la base de datos",
          503,
          "DATABASE_UNAVAILABLE"
        );
      }

      throw error;
    }
  }

  /**
   * Obtiene el perfil completo de un usuario autenticado.
   * Retorna información del usuario excluyendo datos sensibles como contraseñas.
   *
   * @static
   * @async
   * @method obtenerPerfil
   * @memberof UserService
   * @param {number|string} userId - Identificador único del usuario
   * @returns {Promise<ServiceResponse>} Perfil del usuario sin información sensible
   * @throws {Error} Cuando el usuario no existe o hay error de conexión
   */
  static async obtenerPerfil(userId) {
    try {
      console.log("🔍 [obtenerPerfil] Obteniendo perfil para usuario:", userId);

      // Validar formato del ID del usuario
      const idValidation = ValidationService.validateId(userId, "usuario");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Consultar datos del usuario en el modelo
      const respuestaModel = await UserModel.obtenerUsuarioPorId(userId);

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo obtener perfil:", respuestaModel);
        return respuestaModel;
      }

      if (!respuestaModel.data) {
        console.error("❌ Usuario no encontrado:", userId);
        return FormatterResponseService.notFound("Usuario", userId);
      }

      const user = respuestaModel.data;

      // Remover información sensible antes de enviar respuesta
      const { password, ...userSafe } = user;

      console.log(
        "✅ Perfil obtenido exitosamente para:",
        user.nombres,
        user.apellidos
      );

      return FormatterResponseService.success(
        userSafe,
        "Perfil obtenido exitosamente",
        {
          status: 200,
          title: "Perfil de Usuario",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio obtener perfil:", error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil de un usuario autenticado.
   * Permite modificar información personal del usuario.
   *
   * @static
   * @async
   * @method actualizarPerfil
   * @memberof UserService
   * @param {number|string} userId - Identificador único del usuario
   * @param {Object} datosActualizacion - Campos a actualizar en el perfil
   * @returns {Promise<ServiceResponse>} Resultado de la actualización
   * @throws {Error} Cuando hay errores de validación o en la base de datos
   */
  static async actualizarPerfil(userId, datosActualizacion) {
    try {
      console.log(
        "🔍 [actualizarPerfil] Actualizando perfil para usuario:",
        userId
      );

      // Log detallado en modo desarrollo
      if (process.env.MODE === "DEVELOPMENT") {
        console.log(
          "📝 Datos de actualización:",
          JSON.stringify(datosActualizacion, null, 2)
        );
      }

      // Validar ID del usuario
      const idValidation = ValidationService.validateId(userId, "usuario");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Validar datos de actualización según esquema definido
      const validacion =
        ValidationService.validateActualizacionPerfil(datosActualizacion);
      if (!validacion.isValid) {
        console.error(
          "❌ Validación de actualización fallida:",
          validacion.errors
        );
        return FormatterResponseService.validationError(
          validacion.errors,
          "Error de validación en actualización de perfil"
        );
      }

      // Ejecutar actualización en el modelo
      const respuestaModel = await UserModel.actualizarUsuario(
        userId,
        datosActualizacion
      );

      if (FormatterResponseService.isError(respuestaModel)) {
        console.error("❌ Error en modelo actualizar perfil:", respuestaModel);
        return respuestaModel;
      }

      console.log("✅ Perfil actualizado exitosamente para usuario:", userId);

      return FormatterResponseService.success(
        respuestaModel.data,
        "Perfil actualizado exitosamente",
        {
          status: 200,
          title: "Perfil Actualizado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio actualizar perfil:", error);

      // Manejar errores específicos de validación
      if (error.name === "ValidationError") {
        return FormatterResponseService.validationError(
          error.details,
          error.message
        );
      }

      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario actual.
   * En sistemas complejos, aquí se invalidarían tokens en el servidor.
   *
   * @static
   * @async
   * @method cerrarSesion
   * @memberof UserService
   * @returns {Promise<ServiceResponse>} Confirmación de cierre de sesión
   */
  static async cerrarSesion() {
    try {
      console.log("🔍 [cerrarSesion] Cerrando sesión...");

      // Nota: En implementaciones avanzadas, aquí se podría:
      // - Invalidar token JWT en una blacklist
      // - Registrar logout en auditoría
      // - Notificar otros sistemas

      return FormatterResponseService.success(
        null,
        "Sesión cerrada exitosamente",
        {
          status: 200,
          title: "Sesión Cerrada",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio cerrar sesión:", error);
      throw error;
    }
  }

  /**
   * Desactiva un usuario del sistema (administradores solamente).
   * Realiza soft delete y notifica al usuario vía WebSocket si está conectado.
   *
   * @static
   * @async
   * @method desactivarUsuario
   * @memberof UserService
   * @param {number|string} usuario_accion - ID del administrador que ejecuta la acción
   * @param {number|string} id_usuario - ID del usuario a desactivar
   * @returns {Promise<ServiceResponse>} Resultado de la desactivación
   * @throws {Error} Cuando hay errores de validación o en la base de datos
   * @security Requiere roles SuperAdmin o Vicerrector
   */
  static async desactivarUsuario(usuario_accion, id_usuario) {
    try {
      console.log("🔍 [desactivarUsuario] Desactivando usuario...");

      // Validar ID del administrador
      const validateIdUser = ValidationService.validateId(
        usuario_accion,
        "id usuario accion"
      );

      if (!validateIdUser.isValid) {
        console.error("❌ Validación de ID fallida:", validateIdUser.errors);
        return FormatterResponseService.validationError(
          validateIdUser.errors,
          "ID de usuario accion inválido"
        );
      }

      // Validar ID del usuario a desactivar
      const validateId = ValidationService.validateId(
        id_usuario,
        "id usuario a desactivar"
      );

      if (!validateId.isValid) {
        console.error("❌ Validación de ID fallida:", validateId.errors);
        return FormatterResponseService.validationError(
          validateId.errors,
          "ID de usuario a desactivar inválido"
        );
      }

      // Prevenir auto-desactivación (medida de seguridad)
      if (usuario_accion === id_usuario) {
        console.error("❌ Intento de auto-desactivación");
        return FormatterResponseService.error(
          "No puedes desactivar tu propio usuario",
          400,
          "Auto-desactivación no permitida"
        );
      }

      // Ejecutar desactivación en el modelo
      const resultado = await UserModel.desactivarUsuario(
        usuario_accion,
        id_usuario
      );

      // ✅ Notificar usuario desactivado vía WebSocket
      console.log(`📡 Emitiendo close_sesion para usuario: ${id_usuario}`);

      const socket = new SocketServices("websocket");
      const io = socket.initializeService();

      io.to(`user_${id_usuario}`).emit("close_sesion", {
        userId: id_usuario,
        actionBy: usuario_accion,
        timestamp: new Date().toISOString(),
        reason: "usuario_desactivado",
        message: "Tu cuenta ha sido desactivada por un administrador",
      });

      console.log(`✅ Usuario ${id_usuario} desactivado y notificado`);

      return FormatterResponseService.success(
        resultado,
        "Usuario desactivado exitosamente",
        {
          status: 200,
          title: "Usuario Desactivado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio desactivar usuario:", error);
      throw error;
    }
  }

  /**
   * Reactiva un usuario previamente desactivado (administradores solamente).
   * Restaura el acceso del usuario al sistema.
   *
   * @static
   * @async
   * @method activarUsuario
   * @memberof UserService
   * @param {number|string} usuario_accion - ID del administrador que ejecuta la acción
   * @param {number|string} id_usuario - ID del usuario a reactivar
   * @returns {Promise<ServiceResponse>} Resultado de la activación
   * @throws {Error} Cuando hay errores de validación o en la base de datos
   * @security Requiere roles SuperAdmin o Vicerrector
   */
  static async activarUsuario(usuario_accion, id_usuario) {
    try {
      console.log("🔍 [activarUsuario] Activando usuario...");

      // Validar ID del administrador
      const validateIdUser = ValidationService.validateId(
        usuario_accion,
        "id usuario accion"
      );

      if (!validateIdUser.isValid) {
        console.error("❌ Validación de ID fallida:", validateIdUser.errors);
        return FormatterResponseService.validationError(
          validateIdUser.errors,
          "ID de usuario accion inválido"
        );
      }

      // Validar ID del usuario a activar
      const validateId = ValidationService.validateId(
        id_usuario,
        "id usuario a activar"
      );

      if (!validateId.isValid) {
        console.error("❌ Validación de ID fallida:", validateId.errors);
        return FormatterResponseService.validationError(
          validateId.errors,
          "ID de usuario a activar inválido"
        );
      }

      // Ejecutar activación en el modelo
      const resultado = await UserModel.activarUsuario(
        usuario_accion,
        id_usuario
      );

      return FormatterResponseService.success(
        resultado,
        "Usuario activado exitosamente",
        {
          status: 200,
          title: "Usuario Activado",
        }
      );
    } catch (error) {
      console.error("💥 Error en servicio activar usuario:", error);
      throw error;
    }
  }
}
