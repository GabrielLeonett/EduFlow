import ValidationService from "./validation.service.js";
import EmailService from "./email.service.js";
import UserModel from "../models/user.model.js";
import SocketServices from "./socket.service.js";
import {
  comparePassword,
  generarPassword,
  hashPassword,
} from "../utils/encrypted.js";
import { createSession } from "../utils/auth.js";
import { asegurarStringEnMinusculas } from "../utils/utilis.js";
import FormatterResponseService from "../utils/FormatterResponseService.js";

/**
 * @class UserService
 * @description Servicio para operaciones de negocio relacionadas con usuarios
 */
export default class UserService {
  /**
   * @static
   * @async
   * @method login
   * @description Iniciar sesión de usuario
   * @param {Object} datos - Datos de login
   * @param {Object} usuario - Usuario para no crear de nuevo la session
   * @returns {Object} Resultado de la operación
   */
  static async login(datos, usuario) {
    try {
      console.log("🔍 [login] Iniciando proceso de login...");

      if (usuario) {
        throw FormatterResponseService.error(
          "Ya hay una sesion iniciada",
          "No se puede crear una sesion si ya existe una",
          404
        );
      }

      // 1. Validar datos de entrada
      const validacion = ValidationService.validateLogin(datos);
      if (!validacion.isValid) {
        console.error("❌ Validación de login fallida:", validacion.errors);
        return FormatterResponseService.validationError(
          validacion.errors,
          "Error de validación en login"
        );
      }

      // 2. Buscar usuario en la base de datos
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

      // 3. Validar contraseña
      console.log("🔐 Validando contraseña...");
      console.log("📝 Contraseña ingresada:", datos.password);
      console.log("📝 Contraseña almacenada", user.password);
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

      // 4. Crear token de sesión
      console.log("🎫 Creando token de sesión...");
      const token = createSession({
        object: {
          id: user.id,
          apellidos: user.apellidos,
          nombres: user.nombres,
          roles: user.roles,
          ...(user.id_pnf && { id_pnf: user.id_pnf }), // ✅ Solo agrega si existe
        },
      });

      console.log(
        "✅ Login exitoso para usuario:",
        user.nombres,
        user.apellidos
      );

      // 5. Preparar respuesta exitosa
      return FormatterResponseService.success(
        {
          token: token,
          user: {
            id: user.id,
            apellidos: user.apellidos,
            nombres: user.nombres,
            primera_vez: user.primera_vez,
            roles: user.roles,
            ...(user.id_pnf && { id_pnf: user.id_pnf }), // ✅ Solo agrega si existe
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

      // Re-lanza el error para que el controlador lo maneje
      throw error;
    }
  }

  /**
   * Enviar el token para la recuperacion de contraseña
   * @static
   * @async
   * @param {object} datos - contiene datos como email
   * @returns {object} - Resultado del enviado del email
   */
  static async EnviarTokenEmail(datos) {
    try {
      console.log("🔍 [EnviarTokenEmail] Iniciando envío de token...");

      // 1. Validar datos de entrada
      const validacion = ValidationService.validatePartialLogin(datos);
      if (!validacion.isValid) {
        console.error("❌ Validación de email fallida:", validacion.errors);
        return FormatterResponseService.validationError(
          validacion.errors,
          "Error de validación del correo"
        );
      }

      // 2. Verificar que el usuario existe
      const respuestaModel = await UserModel.obtenerUsuarioPorEmail(
        datos.email
      );
      console.log(respuestaModel);

      if (respuestaModel.state != "success") {
        console.log("❌ Usuario no encontrado:", datos.email);
        // Por seguridad, no revelar que el email no existe
        return FormatterResponseService.success(
          null,
          "Si el email existe, se ha enviado el token de recuperación",
          { status: 200, title: "Token Enviado" }
        );
      }

      const usuario = respuestaModel.data[0];

      // 3. Generar token seguro (sin hash para el usuario)
      const tokenPlano = await generarPassword(16); // Más largo para seguridad
      const token_hash = await hashPassword(tokenPlano);

      // 4. Guardar token con expiración (ej: 1 hora)
      await UserModel.GuardarTokenEmail(datos.email, token_hash);

      // 5. Construir URL con parámetros correctos
      const resetUrl = `${
        process.env.ORIGIN_FRONTEND
      }/recuperar-contrasena?email=${encodeURIComponent(
        datos.email
      )}&token=${encodeURIComponent(tokenPlano)}`;

      // 6. Preparar email con token PLANO (no el hash) y link directo
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

      // 7. Enviar email
      const emailService = new EmailService();
      const resultadoEmail = await emailService.enviarEmail({
        Destinatario: datos.email,
        Correo: correo,
        verificarEmail: false,
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
   * @static
   * @async
   * @method VerificarToken
   * @description Verifica si un token de recuperación es válido
   * @param {string} email - Email del usuario
   * @param {string} token - Token proporcionado por el usuario (sin hash)
   * @returns {Object} Resultado de la verificación
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
      // 2. Verificar que el token no haya expirado
      const ahora = new Date();
      const expiracion = new Date(usuario.reset_password_expires);

      if (ahora > expiracion) {
        console.log("❌ Token expirado para:", email);
        return FormatterResponseService.error("Token expirado", {
          status: 400,
          title: "Token Expirado",
        });
      }

      // 3. Comparar el token plano con el hash almacenado
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
   * @static
   * @async
   * @method cambiarContraseña
   * @description Cambiar contraseña del usuario (autenticado o con token de recuperación)
   * @param {Object} datos - Datos para cambiar contraseña
   * @param {Object} [usuarioActual] - Usuario actual autenticado (opcional)
   * @returns {Object} Resultado de la operación
   */
  static async cambiarContraseña(datos, usuarioActual = null) {
    try {
      console.log("🔍 [cambiarContraseña] Iniciando cambio de contraseña...");
      console.log(
        "📝 Modo:",
        usuarioActual ? "USUARIO_AUTENTICADO" : "RECUPERACION_CON_TOKEN"
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log("📝 Datos recibidos:", {
          datos: datos,
          usuarioActual: usuarioActual
            ? {
                id: usuarioActual.id,
                nombres: usuarioActual.nombres,
                apellidos: usuarioActual.apellidos,
              }
            : "RECUPERACION_CON_TOKEN",
        });
      }

      // 1. Validar datos de entrada según el modo
      let validacion;
      if (usuarioActual) {
        // Modo usuario autenticado - valida contraseña actual
        validacion = ValidationService.validateContrasenia(datos);
      } else {
        // Modo recuperación - valida solo email, token y nueva contraseña
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

      // 2. Lógica según el modo de operación
      if (usuarioActual) {
        // 🔐 MODO USUARIO AUTENTICADO
        console.log("🔐 Modo: Usuario autenticado");

        console.log("🔍 Obteniendo datos del usuario para validación...");
        const respuestaUsuario = await UserModel.obtenerUsuarioPorId(
          usuarioActual.id
        );

        if (!respuestaUsuario.data || respuestaUsuario.data.length === 0) {
          console.error("❌ Usuario no encontrado:", usuarioActual.id);
          return FormatterResponseService.notFound("Usuario no encontrado");
        }

        console.log("✅ Datos del usuario obtenidos para validación");
        const { password } = respuestaUsuario.data[0];
        usuarioParaCambio = respuestaUsuario.data[0];

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

        const { email, token } = datos;

        // Verificar que el token sea válido y no haya expirado
        console.log("🔍 Verificando token de recuperación...");

        this.VerificarToken(email, token);
      }

      // 3. Hashear nueva contraseña (común para ambos modos)
      console.log("🔒 Hasheando nueva contraseña...");
      const passwordHash = await hashPassword(datos.password);

      // 4. Cambiar contraseña en la base de datos
      console.log("💾 Actualizando contraseña en base de datos...");

      let respuestaModel;
      if (usuarioActual) {
        // Modo autenticado - cambiar contraseña normalmente
        respuestaModel = await UserModel.cambiarContraseña(
          usuarioActual.id,
          passwordHash
        );
      } else {
        // Modo recuperación - cambiar contraseña y limpiar token
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

      // Re-lanza el error para que el controlador lo maneje
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method verificarSesion
   * @description Verificar la sesión del usuario
   * @param {Object} user - Usuario autenticado
   * @returns {Object} Resultado de la operación
   */
  static async verificarSesion(user) {
    try {
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

      if (["ECONNREFUSED", "ETIMEDOUT"].includes(error.code)) {
        return FormatterResponseService.error(
          "Error de conexión con la base de datos",
          503,
          "DATABASE_UNAVAILABLE"
        );
      }

      // Re-lanza el error para que el controlador lo maneje
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method obtenerPerfil
   * @description Obtener perfil del usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} Resultado de la operación
   */
  static async obtenerPerfil(userId) {
    try {
      console.log("🔍 [obtenerPerfil] Obteniendo perfil para usuario:", userId);

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(userId, "usuario");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

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

      // Remover información sensible antes de enviar
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
      // Re-lanza el error para que el controlador lo maneje
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method actualizarPerfil
   * @description Actualizar perfil del usuario
   * @param {number} userId - ID del usuario
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Resultado de la operación
   */
  static async actualizarPerfil(userId, datosActualizacion) {
    try {
      console.log(
        "🔍 [actualizarPerfil] Actualizando perfil para usuario:",
        userId
      );

      if (process.env.MODE === "DEVELOPMENT") {
        console.log(
          "📝 Datos de actualización:",
          JSON.stringify(datosActualizacion, null, 2)
        );
      }

      // Validar ID de usuario
      const idValidation = ValidationService.validateId(userId, "usuario");
      if (!idValidation.isValid) {
        console.error("❌ Validación de ID fallida:", idValidation.errors);
        return FormatterResponseService.validationError(
          idValidation.errors,
          "ID de usuario inválido"
        );
      }

      // Validar datos de actualización
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

      if (error.name === "ValidationError") {
        return FormatterResponseService.validationError(
          error.details,
          error.message
        );
      }

      // Re-lanza el error para que el controlador lo maneje
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method cerrarSesion
   * @description Cerrar sesión del usuario
   * @returns {Object} Resultado de la operación
   */
  static async cerrarSesion() {
    try {
      console.log("🔍 [cerrarSesion] Cerrando sesión...");

      // En un sistema más complejo, aquí podrías invalidar tokens, etc.
      // Por ahora simplemente retornamos éxito ya que el controlador se encarga de limpiar la cookie

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
      // Re-lanza el error para que el controlador lo maneje
      throw error;
    }
  }

  /**
   * @static
   * @async
   * @method desactivarUsuario
   * @description Desactivar un usuario del sistema
   * @param {number} usuario_accion - ID del usuario que realiza la acción
   * @param {number} id_usuario - ID del usuario a desactivar
   * @returns {Object} Resultado de la operación
   */
  static async desactivarUsuario(usuario_accion, id_usuario) {
    try {
      console.log("🔍 [desactivarUsuario] Desactivando usuario...");

      // Validar ID del usuario que realiza la acción
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

      // Verificar que no sea auto-desactivación
      if (usuario_accion === id_usuario) {
        console.error("❌ Intento de auto-desactivación");
        return FormatterResponseService.error(
          "No puedes desactivar tu propio usuario",
          400,
          "Auto-desactivación no permitida"
        );
      }

      // Llamar al modelo para desactivar el usuario
      const resultado = await UserModel.desactivarUsuario(
        usuario_accion,
        id_usuario
      );

      // ✅ CORREGIDO: Emitir evento de cierre de sesión
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
   * @static
   * @async
   * @method activarUsuario
   * @description Activar un usuario previamente desactivado
   * @param {number} usuario_accion - ID del usuario que realiza la acción
   * @param {number} id_usuario - ID del usuario a activar
   * @returns {Object} Resultado de la operación
   */
  static async activarUsuario(usuario_accion, id_usuario) {
    try {
      console.log("🔍 [activarUsuario] Activando usuario...");

      // Validar ID del usuario que realiza la acción
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

      // Llamar al modelo para activar el usuario
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
