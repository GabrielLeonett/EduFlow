export default function databaseConfig(env) {
  const isProduction = env.NODE_ENV === "production";

  // Determinar el tipo de conexión
  let connectionConfig;

  if (env.DATABASE_CONNECTION_URL) {
    // Opción 1: URL de conexión completa
    connectionConfig = {
      connectionString: env.DATABASE_CONNECTION_URL,
    };
  } else if (env.DATABASE_URL_EXTERNAL) {
    // Opción 2: URL externa
    connectionConfig = {
      connectionString: env.DATABASE_URL_EXTERNAL,
    };
  } else {
    // Opción 3: Parámetros individuales
    connectionConfig = {
      host: env.DB_HOST || "localhost",
      port: parseInt(env.DB_PORT || "5432", 10),
      user: env.DB_USER || "postgres",
      password: env.DB_PASSWORD || "1234",
      database: env.DB_NAME || "proyecto_uptamca",
    };
  }

  // Configurar SSL basado en el entorno
  const sslConfig = 
    isProduction || env.DB_SSL === "true" 
      ? { rejectUnauthorized: false } 
      : false;

  // Si usamos connectionString, SSL va dentro de connectionString o como propiedad separada
  if (connectionConfig.connectionString) {
    // Para connectionString, el SSL se puede manejar como query param o como propiedad separada
    // Knex acepta SSL como propiedad separada incluso con connectionString
    connectionConfig.ssl = sslConfig;
  } else {
    // Para configuración por partes, SSL se agrega al objeto connection
    connectionConfig.ssl = sslConfig;
  }

  return {
    // Cliente de base de datos
    client: env.DATABASE_CLIENT || "pg",

    // Conexión (unificada)
    connection: connectionConfig,

    // Pool de conexiones
    pool: {
      min: parseInt(env.DB_POOL_MIN || 2, 10),
      max: parseInt(env.DB_POOL_MAX || 10, 10),
      acquireTimeoutMillis: parseInt(env.DB_POOL_ACQUIRE || 30000, 10),
      idleTimeoutMillis: parseInt(env.DB_POOL_IDLE || 10000, 10),
      reapIntervalMillis: parseInt(env.DB_REAP_INTERVAL || 1000, 10),
      createRetryIntervalMillis: parseInt(
        env.DB_CREATE_RETRY_INTERVAL || 100,
        10
      ),
      createTimeoutMillis: parseInt(env.DB_CREATE_TIMEOUT || 30000, 10),
    },

    // Migraciones
    migrations: {
      directory: env.DB_MIGRATIONS_DIR || "./migrations",
      tableName: "knex_migrations",
      schemaName: env.DB_SCHEMA || "public",
      extension: "js",
      loadExtensions: [".js"],
    },

    // Seeds
    seeds: {
      directory: env.DB_SEEDS_DIR || "./seeds",
      loadExtensions: [".js"],
    },

    // Configuración adicional
    debug: env.DB_DEBUG === "true",
    asyncStackTraces: env.DB_ASYNC_STACK_TRACES === "true",

    // Logging
    log: {
      warn(message) {
        console.warn(`[DB WARN] ${message}`);
      },
      error(message) {
        console.error(`[DB ERROR] ${message}`);
      },
      debug(message) {
        if (env.DB_DEBUG === "true") {
          console.log(`[DB DEBUG] ${message}`);
        }
      },
    },

    // Retry config
    retry: {
      count: parseInt(env.DB_RETRY_COUNT || 3, 10),
      delay: parseInt(env.DB_RETRY_DELAY || 1000, 10),
    },
  };
}