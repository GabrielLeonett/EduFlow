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
import filesConfig from "./files.config.js";
import authConfig from "./auth.config.js";
import securityConfig from "./security.config.js";
import serverConfig from "./server.config.js";

const config = () => {
  return {
    database: databaseConfig(process.env),
    logger: loggerConfig(process.env),
    files: filesConfig(process.env),
    auth: authConfig(process.env),
    security: securityConfig(process.env),
    server: serverConfig(process.env),
  };
};
const configuraicion = config();

export default configuraicion;
