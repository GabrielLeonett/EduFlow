// db/client.js
import { loadEnv } from "../utils/utilis.js";
import { Pool } from "pg";

loadEnv();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL_EXTERNAL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  // Configuraciones adicionales recomendadas para el pool
  max: 20, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // cierra clientes inactivos después de 30 segundos
  connectionTimeoutMillis: 2000, // tiempo máximo para obtener conexión
  maxUses: 7500, // máximo número de usos por cliente (previte memory leaks)
});

export default pool;