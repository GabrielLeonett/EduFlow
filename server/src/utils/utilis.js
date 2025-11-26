// utils/envLoader.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Carga las variables de entorno desde el archivo correspondiente al entorno actual
 * @returns {Object} Objeto con las variables de entorno cargadas
 * @example
 * // Carga .env.development o .env.production según NODE_ENV
 * const env = loadEnv();
 * console.log(env.DB_PASSWORD);
 */
export function loadEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const env = process.env.NODE_ENV || "development";
  const envFile = path.resolve(__dirname, `../.env.${env}`);

  // Cargar y verificar
  const result = dotenv.config({ path: envFile });

  if (result.error) {
    console.error("Error loading .env file:", result.error);
    throw result.error;
  }
}

/**
 * Convierte una variable a string en minúsculas si es de tipo string
 * @param {*} variable - Variable a convertir
 * @returns {string|undefined} String en minúsculas o undefined si no es string
 * @example
 * asegurarStringEnMinusculas("HOLA"); // "hola"
 * asegurarStringEnMinusculas(123); // undefined
 */
export function asegurarStringEnMinusculas(variable) {
  if (typeof variable === "string") {
    return variable.toLowerCase();
  }
}

/**
 * Parsea un campo que puede ser JSON string, array u otro tipo a array
 * @param {*} field - Campo a parsear (string JSON, array, u otro tipo)
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {Array} Array parseado
 * @throws {Error} Si el formato del campo es inválido
 * @example
 * parseJSONField('["a", "b"]', 'tags'); // ["a", "b"]
 * parseJSONField(["a", "b"], 'tags'); // ["a", "b"]
 * parseJSONField("texto", 'tags'); // Error
 */
export const parseJSONField = (field, fieldName) => {
  if (!field) return [];

  try {
    // Si ya es un array, retornarlo directamente
    if (Array.isArray(field)) {
      return field;
    }

    // Si es string, parsearlo
    if (typeof field === "string") {
      const parsed = JSON.parse(field);
      console.log("Parsed field:", parsed);
      return Array.isArray(parsed) ? parsed : [parsed];
    }

    // Si es otro tipo, convertirlo a array
    return [field];
  } catch (error) {
    console.error(`❌ Error parseando ${fieldName}:`, error);
    throw new Error(`Formato inválido en ${fieldName}`);
  }
};

export function convertToPostgresArray(input) {
  console.log("Input recibido:", input);
  console.log("Tipo del input:", typeof input);

  if (!input) return "{}";

  let array;

  // Si ya es un array, usarlo directamente
  if (Array.isArray(input)) {
    array = input;
  }
  // Si es un string, intentar parsearlo como JSON
  else if (typeof input === "string") {
    try {
      array = JSON.parse(input);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return "{}";
    }
  }
  // Si es otro tipo, convertirlo a array
  else {
    array = [input];
  }

  // Validar que sea un array
  if (!Array.isArray(array) || array.length === 0) {
    return "{}";
  }

  // Convertir a formato PostgreSQL: {element1,element2,element3}
  const postgresFormat = `{${array.map((item) => `"${item}"`).join(",")}}`;
  console.log("Formato PostgreSQL:", postgresFormat);
  return postgresFormat;
}

/**
 *
 * @param {string} cookieHeader Objeto Cookie
 * @param {string} cookieName Nombre de la cookie que se desea obtener
 * @returns {string} valor de la cookie
 * @example
 * const token = getCookie(socket.handshake.headers.cookie, 'autorization');
 */
export function getCookie(cookieHeader, cookieName) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  const cookie = cookies.find((c) => c.trim().startsWith(`${cookieName}=`));

  return cookie ? cookie.split("=")[1].trim() : null;
}

export const UTILS = {
  formatearHora: (horaHHMM) => {
    const horas = Math.floor(horaHHMM / 100);
    const minutos = horaHHMM % 100;
    const periodo = horas >= 12 ? "PM" : "AM";
    const horas12 = horas > 12 ? horas - 12 : horas === 0 ? 12 : horas;
    return `${horas12}:${minutos.toString().padStart(2, "0")} ${periodo}`;
  },

  obtenerDiaNombre: (diaIndex) => {
    const dias = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    return dias[diaIndex] || "";
  },
  
  horariosAcademicos: [
    "07:00",
    "07:45",
    "08:30",
    "09:15",
    "10:00",
    "10:45",
    "11:30",
    "12:15",
    "13:00",
    "13:45",
    "14:30",
    "15:15",
    "16:00",
    "16:45",
    "17:30",
    "18:15",
    "19:00",
     
  ],

  sumar45Minutos: (horaInicio, bloques) => {
    const horas = Math.floor(horaInicio / 100);
    const minutos = horaInicio % 100;
    const minutosTotales = horas * 60 + minutos + bloques * 45;
    const nuevasHoras = Math.floor(minutosTotales / 60);
    const nuevosMinutos = minutosTotales % 60;
    return nuevasHoras * 100 + nuevosMinutos;
  },

  horasMinutos: (hora, minuto) => {
    return parseInt(hora) * 60 + parseInt(minuto);
  },

  calcularHorasHHMM: (minutosTotales) => {
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    return horas * 100 + minutos;
  },
};


import dns from 'dns/promises';

/**
 * Verifica si hay conexión a internet
 * @returns {Promise<boolean>} True si hay conexión, false si no
 */
export async function verificarConexionInternet() {
  try {
    // Intentar resolver un dominio confiable
    await dns.resolve('google.com');
    return true;
  } catch (error) {
    console.error('❌ Sin conexión a internet:', error.message);
    return false;
  }
}