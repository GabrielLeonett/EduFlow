import {loadEnv} from '../utils/utilis.js';

loadEnv();

// knexfile.js
export default {
  development: {
    client: "pg", // o 'pg', 'sqlite3', etc.
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
  production: {
    client: "pg", // o 'pg', 'sqlite3', etc.
    connection: {
      connectionString: process.env.DATABASE_URL_EXTERNAL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 5, // Número conservador para Render (especialmente en plan gratis)
      acquireTimeoutMillis: 60000, // 60 segundos para adquirir conexión
      idleTimeoutMillis: 30000, // Liberar conexiones inactivas después de 30s
      reapIntervalMillis: 1000, // Revisar conexiones inactivas cada 1s
      createRetryIntervalMillis: 200, // Intervalo para reintentar conexión
      createTimeoutMillis: 30000, // Tiempo máximo para crear nueva conexión
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};
