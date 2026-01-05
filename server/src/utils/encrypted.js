import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * @module passwordUtils
 * @description Utilidades para generación y manejo seguro de contraseñas
 * @exports generarPassword
 * @exports hashPassword
 * @exports comparePassword
 */

/**
 * @function generarPassword
 * @description Genera una contraseña aleatoria segura
 * @returns {Promise<string>} Contraseña aleatoria de 8 caracteres hexadecimales
 * @example
 * const nuevaPassword = await generarPassword();
 * // Ejemplo de resultado: "1a3f5c7e"
 */
export async function generarPassword(tamano = 4) {
  const randomString = crypto.randomBytes(tamano).toString("hex");
  return randomString;
}

/**
 * @function hashPassword
 * @description Hashea una contraseña usando bcrypt con salt automático
 * @param {string} password - Contraseña en texto plano a hashear
 * @returns {Promise<string>} Contraseña hasheada
 * @throws {Error} Si ocurre un error durante el hasheo
 * @example
 * const hash = await hashPassword('miContraseña123');
 */
export async function hashPassword(password) {
  try {
    const saltRounds = 10; // Coste del hasheo (mayor = más seguro pero más lento)
    const passwordHasheada = await bcrypt.hash(password, saltRounds);
    return passwordHasheada;
  } catch (error) {
    console.error("Error al hashear la contraseña:", error);
    throw new Error("Error al procesar la contraseña");
  }
}

/**
 * @function comparePassword
 * @description Compara una contraseña en texto plano con un hash bcrypt
 * @param {string} password - Contraseña en texto plano a verificar
 * @param {string} hashedPassword - Hash bcrypt almacenado
 * @returns {Promise<boolean>} true si coinciden, false si no
 * @throws {Error} Si ocurre un error durante la comparación
 * @example
 * const esValida = await comparePassword('intento123', hashAlmacenado);
 */
export async function comparePassword(password, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error al comparar la contraseña:", error);
    throw new Error("Error al procesar la contraseña");
  }
}
