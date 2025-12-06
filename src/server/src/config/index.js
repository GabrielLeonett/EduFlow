import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Obtener __dirname correctamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env según NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
const envPath = path.resolve(__dirname, `../../${envFile}`);

// Cargar el archivo .env específico
dotenv.config({ path: envPath });

// También cargar .env base si existe
dotenv.config();

// Ahora importar configuraciones
import databaseConfig from "./database.config.js";
import loggerConfig from "./logger.config.js";

const config = {
  database: databaseConfig(process.env),
  logger: loggerConfig(process.env),
  // Aquí agregarás más configuraciones después
};

export default config;
