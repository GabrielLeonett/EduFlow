/**
 * @class EmailService
 * @description Clase para el envío de correos electrónicos utilizando nodemailer.
 * Proporciona métodos para enviar emails con plantillas HTML y manejo de adjuntos.
 * @requires nodemailer
 */

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "../utils/utilis.js";
loadEnv();

// Para manejar rutas en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class EmailService {
  /**
   * @constructor
   * @description Inicializa el servicio de correo con la configuración necesaria
   * @throws {Error} Cuando no se encuentra el archivo logo.png
   */
  constructor() {
    // Corregir la ruta del logo - buscar en varias ubicaciones posibles
    this.logoPath = this.findLogoPath();

    if (!this.logoPath) {
      console.warn("⚠️ Logo no encontrado. Los correos se enviarán sin logo.");
      // No lanzar error, permitir que el servicio funcione sin logo
    }

    /**
     * @constant {Object} EMAIL_CONFIG
     * @description Configuración básica para el servicio de correo electrónico
     */
    this.EMAIL_CONFIG = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_CREDENTIAL,
    };

    this.año = new Date().getUTCFullYear();

    /**
     * @type {nodemailer.Transporter}
     * @description Instancia del transporter de nodemailer
     */
    this.transporter = this.createTransporter();
  }
  /**
   * @private
   * @method findLogoPath
   * @description Busca el archivo logo.png en varias ubicaciones posibles
   * @returns {string|null} Ruta del logo o null si no se encuentra
   */
  findLogoPath() {
    const possiblePaths = [
      // Ruta relativa desde el servicio
      path.join(__dirname, "../utils/logo.png"),
      // Ruta desde el directorio raíz del proyecto
      path.join(process.cwd(), "utils/logo.png"),
      // Ruta desde el directorio actual
      path.join(__dirname, "../../utils/logo.png"),
      // Otras posibles ubicaciones
      path.join(process.cwd(), "server/utils/logo.png"),
      path.join(__dirname, "../../../utils/logo.png"),
    ];

    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        console.log(`✅ Logo encontrado en: ${logoPath}`);
        return logoPath;
      }
    }

    console.warn("❌ Logo no encontrado en las siguientes ubicaciones:");
    possiblePaths.forEach((p) => console.log(`   - ${p}`));
    return null;
  }

  /**
   * @private
   * @method createTransporter
   * @description Crea y configura el transporter de nodemailer
   * @returns {nodemailer.Transporter} Transporter configurado
   */
  createTransporter() {
    return nodemailer.createTransport({
      service: "gmail",
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: this.EMAIL_CONFIG.user,
        pass: this.EMAIL_CONFIG.pass,
      },
    });
  }

  /**
   * @privateñ
   * @method generateEmailTemplate
   * @description Genera la plantilla HTML estructurada para el correo
   * @param {string} content - Contenido HTML del cuerpo del correo
   * @returns {string} Plantilla HTML completa
   */
  generateEmailTemplate(content) {
    const logoSection = this.logoPath
      ? `<img src="cid:logo" alt="Logo UPTAMCA" style="width: 100px;">`
      : `<h1 style="color: white; margin: 0;">UPTAMCA</h1>`;

    return `
      <div style="font-family: Poppins, sans-serif; max-width: 600px; margin: 0 auto;">
          <header style="background-color: #1C75BA; padding: 20px; text-align: center;">
              ${logoSection}
          </header>

          <div style="padding: 20px;">
            ${content}
            <p style="color: #7f8c8d; font-size: 0.9em; border-top: 1px solid #eee; padding-top: 15px;">
                      Este mensaje está dirigido exclusivamente al destinatario. Si usted no es la persona
                      a quien va dirigido, le solicitamos eliminarlo y notificarlo al remitente.
            </p>
          </div>
          <footer style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px;">
              © ${this.año} UPTAMCA. Todos los derechos reservados.
          </footer>
      </div>
    `;
  }

  /**
   * @private
   * @method createMailOptions
   * @description Crea las opciones de envío del correo
   * @param {Object} params - Parámetros del correo
   * @param {string} params.Destinatario - Dirección de correo del destinatario
   * @param {Object} params.Correo - Configuración específica del correo
   * @param {string} params.Correo.asunto - Asunto del correo electrónico
   * @param {string} params.Correo.html - Contenido HTML del cuerpo del correo
   * @returns {nodemailer.SendMailOptions} Opciones del correo
   */
  createMailOptions({ Destinatario, Correo }) {
    return {
      from: this.EMAIL_CONFIG.user,
      to: Destinatario,
      subject: Correo.asunto,
      html: this.generateEmailTemplate(Correo.html),
      attachments: [
        {
          filename: "logo.png",
          path: this.logoPath,
          cid: "logo",
        },
      ],
    };
  }

  /**
   * @method validarFormatoEmail
   * @description Valida el formato del email con expresión regular
   * @param {string} email - Dirección de correo a validar
   * @returns {Object} Resultado de la validación
   */
  validarFormatoEmail(email) {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const esValido = emailRegex.test(email);

    return {
      valido: esValido,
      mensaje: esValido
        ? "Formato de email válido"
        : "Formato de email inválido",
    };
  }

  /**
   * @async
   * @method verificarEmailConAPI
   * @description Verifica un email usando AbstractAPI Email Reputation con manejo robusto de errores
   * @param {string} email - Dirección de correo a verificar
   * @returns {Promise<Object>} Resultado de la verificación
   */
  async verificarEmailConAPI(email) {
    try {
      const API_KEY = process.env.EMAIL_VERIFICATION_API_KEY;

      // Si no hay API key, usar validación local inmediatamente
      if (!API_KEY) {
        console.warn(
          "⚠️ [EmailService] No hay API key, usando validación local"
        );
        return this.validarEmailLocal(email);
      }

      console.log(`🌐 [EmailService] Verificando email con API: ${email}`);

      // Timeout para evitar esperas infinitas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(
        `https://emailreputation.abstractapi.com/v1/?api_key=${API_KEY}&email=${encodeURIComponent(
          email
        )}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `⚠️ [EmailService] API respondió con status: ${response.status}`
        );
        // Si es error del servidor (5xx) o rate limiting (429), usar validación local
        if (response.status >= 500 || response.status === 429) {
          return this.validarEmailLocal(email);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Debug: Ver respuesta completa de la API
      if (process.env.NODE_ENV === "development") {
        console.log(
          "📨 [EmailService] Respuesta API:",
          JSON.stringify(data, null, 2)
        );
      }

      // Verificar estructura de respuesta
      if (!data || typeof data !== "object") {
        console.warn("⚠️ [EmailService] Respuesta API inválida");
        return this.validarEmailLocal(email);
      }

      // Usar los campos correctos de la API de Reputation
      const esValido = data.email_deliverability?.is_format_valid === true;
      const esEntregable = data.email_deliverability?.status === "deliverable";
      const noEsDesechable = data.email_quality?.is_disposable === false;

      return {
        existe: esValido && esEntregable && noEsDesechable,
        valido: esValido,
        calidad: parseFloat(data.email_quality?.score) || 0,
        mensaje: this.generarMensajeReputacion(data),
        datos: data,
        verificadoCon: "api_reputacion_email",
      };
    } catch (error) {
      console.warn(`⚠️ [EmailService] Error en API: ${error.message}`);

      // Clasificar el tipo de error
      if (error.name === "AbortError") {
        console.warn(
          "⏰ [EmailService] Timeout en API, usando validación local"
        );
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        console.warn("🌐 [EmailService] Error de red, usando validación local");
      }

      // Para cualquier error de API, usar validación local como respaldo
      return this.validarEmailLocal(email);
    }
  }

  /**
   * @private
   * @method validarEmailLocal
   * @description Validación local de email cuando la API no está disponible
   * Realiza una verificación básica de formato y dominios comunes
   * @param {string} email - Dirección de correo a validar
   * @returns {Object} Resultado de la validación local
   */
  validarEmailLocal(email) {
    // Validación básica de formato
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      return {
        existe: false,
        valido: false,
        calidad: 0,
        mensaje: "Formato de email inválido",
        verificadoCon: "validacion_local",
      };
    }

    // Extraer dominio del email
    const dominio = email.split("@")[1]?.toLowerCase();

    if (!dominio) {
      return {
        existe: false,
        valido: false,
        calidad: 0,
        mensaje: "Dominio de email inválido",
        verificadoCon: "validacion_local",
      };
    }

    // Lista de dominios de email desechables/temporales comunes
    const dominiosDesechables = [
      "tempmail.com",
      "guerrillamail.com",
      "mailinator.com",
      "10minutemail.com",
      "yopmail.com",
      "throwawaymail.com",
      "fakeinbox.com",
      "temp-mail.org",
      "trashmail.com",
      "disposablemail.com",
      "getairmail.com",
      "tmpmail.org",
    ];

    // Verificar si es un dominio desechable
    const esDesechable = dominiosDesechables.some(
      (dom) => dominio.includes(dom) || dominio.endsWith(dom)
    );

    if (esDesechable) {
      return {
        existe: false,
        valido: false,
        calidad: 0.1,
        mensaje: "Email desechable (temporal) detectado",
        verificadoCon: "validacion_local",
      };
    }

    // Lista de dominios de proveedores legítimos comunes
    const dominiosLegitimos = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "protonmail.com",
      "live.com",
      "msn.com",
      "ymail.com",
    ];

    // Verificar si es un dominio legítimo conocido
    const esLegitimo = dominiosLegitimos.some((dom) => dominio === dom);

    // Calcular puntuación de calidad basada en el dominio
    let calidad = 0.5; // Puntuación base para dominios desconocidos

    if (esLegitimo) {
      calidad = 0.8; // Puntuación alta para proveedores conocidos
    }

    // Verificación adicional de estructura del dominio
    const partesDominio = dominio.split(".");
    const tieneExtensionValida =
      partesDominio.length >= 2 &&
      partesDominio[partesDominio.length - 1].length >= 2;

    if (!tieneExtensionValida) {
      return {
        existe: false,
        valido: false,
        calidad: 0.1,
        mensaje: "Extensión de dominio inválida",
        verificadoCon: "validacion_local",
      };
    }

    return {
      existe: true, // Asumimos que existe (no podemos verificarlo localmente)
      valido: true,
      calidad: calidad,
      mensaje: esLegitimo
        ? "Email válido y de proveedor confiable"
        : "Email válido (verificación limitada sin API)",
      verificadoCon: "validacion_local",
      detalles: {
        dominio: dominio,
        esDesechable: esDesechable,
        esLegitimo: esLegitimo,
        extensionValida: tieneExtensionValida,
      },
    };
  }

  /**
   * @private
   * @method generarMensajeReputacion
   * @description Genera un mensaje descriptivo basado en la respuesta de Email Reputation API
   * @param {Object} data - Datos de la API
   * @returns {string} Mensaje descriptivo
   */
  generarMensajeReputacion(data) {
    const deliverability = data.email_deliverability;
    const quality = data.email_quality;

    if (!deliverability?.is_format_valid) {
      return "Formato de email inválido";
    }

    if (quality?.is_disposable) {
      return "Email desechable (temporal) detectado";
    }

    if (deliverability?.status === "deliverable") {
      const score = parseFloat(quality?.score) || 0;
      if (score > 0.8) {
        return "Email válido y de alta calidad";
      } else if (score > 0.5) {
        return "Email válido y de calidad media";
      } else {
        return "Email válido pero de baja calidad";
      }
    } else if (deliverability?.status === "undeliverable") {
      return "Email no entregable";
    } else {
      return "Estado de email desconocido";
    }
  }

  /**
   * @private
   * @method crearRespuestaErrorEmail
   * @description Crea una respuesta de error estandarizada para emails inválidos
   * @param {Array} errors - Array de errores de validación
   * @returns {Object} Respuesta de error formateada
   */
  crearRespuestaErrorEmail(errors) {
    return {
      state: "email_error",
      status: 400,
      title: "Datos Erróneos",
      message: "Los datos de entrada no son válidos",
      error: errors,
    };
  }

  /**
   * @async
   * @method verificarYValidarEmails
   * @description Verifica y valida uno o múltiples emails antes del envío
   * Implementa validación local como respaldo cuando la API falla
   * @param {string|string[]} destinatarios - Email o array de emails a verificar
   * @returns {Promise<Object>} Resultado de la verificación
   */
  async verificarYValidarEmails(destinatarios) {
    const emails = Array.isArray(destinatarios)
      ? destinatarios
      : [destinatarios];
    const errores = [];
    const emailsValidos = [];
    const resultadosIndividuales = [];
    let apiDisponible = true;

    console.log(`🔍 [EmailService] Verificando ${emails.length} email(s)`);

    for (const email of emails) {
      try {
        // Validación básica de formato primero (siempre local)
        const validacionFormato = this.validarFormatoEmail(email);

        if (!validacionFormato.valido) {
          const error = {
            email: email,
            mensaje: validacionFormato.mensaje,
            tipo: "formato_invalido",
            metodo: "validacion_local",
          };
          errores.push(error);
          resultadosIndividuales.push({ email, valido: false, error });
          continue;
        }

        let verificacion;
        let metodoVerificacion = "api_reputacion_email";

        // Intentar verificación con API primero
        if (apiDisponible) {
          try {
            verificacion = await this.verificarEmailConAPI(email);
            metodoVerificacion = verificacion.verificadoCon;

            // Si la API falló fatalmente, desactivar para próximos emails
            if (verificacion.verificadoCon === "validacion_local") {
              apiDisponible = false;
              console.warn(
                `⚠️ [EmailService] API no disponible, usando validación local para email: ${email}`
              );
            }
          } catch (apiError) {
            // Error fatal en API, usar validación local
            apiDisponible = false;
            console.warn(
              `⚠️ [EmailService] Error en API, cambiando a validación local: ${apiError.message}`
            );
            verificacion = this.validarEmailLocal(email);
            metodoVerificacion = "validacion_local_fallback";
          }
        } else {
          // API no disponible, usar solo validación local
          verificacion = this.validarEmailLocal(email);
          metodoVerificacion = "validacion_local_fallback";
        }

        // Evaluar el resultado de la verificación
        const esValido = verificacion.valido && verificacion.existe;

        if (!esValido) {
          const error = {
            email: email,
            mensaje: verificacion.mensaje,
            tipo: "email_no_verificado",
            metodo: metodoVerificacion,
            detalles: verificacion,
            calidad: verificacion.calidad || 0,
          };
          errores.push(error);
          resultadosIndividuales.push({ email, valido: false, error });
        } else {
          emailsValidos.push(email);
          resultadosIndividuales.push({
            email,
            valido: true,
            metodo: metodoVerificacion,
            calidad: verificacion.calidad || 0.5,
            mensaje: verificacion.mensaje,
          });

          console.log(
            `✅ [EmailService] Email válido: ${email} (${metodoVerificacion})`
          );
        }
      } catch (error) {
        // Error inesperado en el proceso de verificación
        console.error(
          `💥 [EmailService] Error inesperado verificando ${email}:`,
          error
        );

        const errorObj = {
          email: email,
          mensaje: "Error inesperado en verificación",
          tipo: "error_proceso",
          metodo: "error",
          detalles: error.message,
        };

        errores.push(errorObj);
        resultadosIndividuales.push({ email, valido: false, error: errorObj });
      }
    }

    // Resumen final
    const resultadoFinal = {
      todosValidos: errores.length === 0,
      emailsValidos: emailsValidos,
      errores: errores,
      totalVerificados: emails.length,
      totalValidos: emailsValidos.length,
      totalErrores: errores.length,
      metodoPrincipal: apiDisponible
        ? "api_reputacion_email"
        : "validacion_local",
      apiDisponible: apiDisponible,
      resultadosIndividuales: resultadosIndividuales,
    };

    console.log(`📊 [EmailService] Resumen verificación:`, {
      total: resultadoFinal.totalVerificados,
      validos: resultadoFinal.totalValidos,
      errores: resultadoFinal.totalErrores,
      metodo: resultadoFinal.metodoPrincipal,
      apiDisponible: resultadoFinal.apiDisponible,
    });

    return resultadoFinal;
  }

  /**
   * @async
   * @method enviarEmail
   * @description Envía un correo electrónico verificando primero la existencia del destinatario
   * @param {Object} params - Objeto con parámetros de envío
   * @param {string} params.Destinatario - Dirección de correo del destinatario
   * @param {Object} params.Correo - Configuración específica del correo
   * @param {string} params.Correo.asunto - Asunto del correo electrónico
   * @param {string} params.Correo.html - Contenido HTML del cuerpo del correo
   * @param {boolean} params.verificarEmail - Si debe verificar el email antes de enviar (default: true)
   * @returns {Promise<Object>} Resultado del envío
   * @throws {Error} Cuando falla el envío del correo
   */
  async enviarEmail({ Destinatario, Correo, verificarEmail = true }) {
    try {
      console.log(
        `📧 [EmailService] Intentando enviar email a: ${Destinatario}`
      );

      // Verificar email antes del envío
      if (verificarEmail) {
        const verificacion = await this.verificarYValidarEmails(Destinatario);

        if (!verificacion.todosValidos) {
          console.error(
            `❌ Email inválido: ${Destinatario}`,
            verificacion.errores
          );
          return this.crearRespuestaErrorEmail(verificacion.errores);
        }
      }

      const mailOptions = this.createMailOptions({ Destinatario, Correo });

      // Enviar email y esperar confirmación
      const resultado = await this.transporter.sendMail(mailOptions);

      console.log(
        `✅ [EmailService] Email enviado exitosamente a: ${Destinatario}`,
        {
          messageId: resultado.messageId,
          asunto: Correo.asunto,
        }
      );

      return {
        success: true,
        state: "success",
        status: 200,
        title: "Correo Enviado",
        message: "El correo electrónico fue enviado exitosamente",
        data: {
          destinatario: Destinatario,
          asunto: Correo.asunto,
          messageId: resultado.messageId,
        },
      };
    } catch (error) {
      console.error(
        `💥 [EmailService] Error al enviar email a: ${Destinatario}`,
        {
          error: error.message,
          asunto: Correo.asunto,
        }
      );

      // Devolver error REAL, no éxito falso
      return {
        success: false,
        state: "error",
        status: 500,
        title: "Error de Envío",
        message: "No se pudo enviar el correo electrónico",
        error: error.message,
        data: {
          destinatario: Destinatario,
          asunto: Correo.asunto,
        },
      };
    }
  }

  /**
   * @async
   * @method enviarEmailMultiple
   * @description Envía un correo electrónico a múltiples destinatarios verificando primero los emails
   * @param {Object} params - Objeto con parámetros de envío
   * @param {string[]} params.Destinatarios - Array de direcciones de correo
   * @param {Object} params.Correo - Configuración específica del correo
   * @param {string} params.Correo.asunto - Asunto del correo electrónico
   * @param {string} params.Correo.html - Contenido HTML del cuerpo del correo
   * @param {boolean} params.verificarEmails - Si debe verificar los emails antes de enviar (default: true)
   * @returns {Promise<Object>} Resultado del envío
   * @throws {Error} Cuando falla el envío del correo
   */
  async enviarEmailMultiple({ Destinatarios, Correo, verificarEmails = true }) {
    try {
      // Verificar emails antes del envío
      if (verificarEmails) {
        const verificacion = await this.verificarYValidarEmails(Destinatarios);

        if (!verificacion.todosValidos) {
          return this.crearRespuestaErrorEmail(verificacion.errores);
        }
      }

      const mailOptions = {
        from: this.EMAIL_CONFIG.user,
        to: Destinatarios.join(", "),
        subject: Correo.asunto,
        html: this.generateEmailTemplate(Correo.html),
        attachments: [
          {
            filename: "logo.png",
            path: this.logoPath,
            cid: "logo",
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);

      return {
        state: "success",
        status: 200,
        title: "Correos Enviados",
        message: `El correo electrónico fue enviado exitosamente a ${Destinatarios.length} destinatarios`,
        data: {
          totalDestinatarios: Destinatarios.length,
          asunto: Correo.asunto,
        },
      };
    } catch (error) {
      throw {
        message:
          "Error al enviar el correo electrónico a múltiples destinatarios",
        tipo: "Correo",
        error: error.message,
      };
    }
  }

  /**
   * @async
   * @method verificarConexion
   * @description Verifica la conexión con el servicio de correo
   * @returns {Promise<boolean>} True si la conexión es exitosa
   * @throws {Error} Cuando falla la verificación de conexión
   */
  async verificarConexion() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      throw {
        message: "Error al verificar la conexión con el servicio de correo",
        tipo: "Conexion",
        error: error.message,
      };
    }
  }
}

/**
 * @description Consideraciones de seguridad importantes para el módulo de correo:
 * 1. Las credenciales deberían manejarse mediante variables de entorno en producción
 * 2. Gmail tiene límites de envío (500 correos/día para cuentas estándar)
 * 3. Para producción considerar servicios especializados como SendGrid o Mailgun
 * 4. Nunca incluir contraseñas directamente en el código fuente
 * 5. Implementar mecanismos de reintento para fallos temporales
 */
