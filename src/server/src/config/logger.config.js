import winston from "winston";

export default function loggerConfig(env) {

  return winston.createLogger({
    // 1. NIVEL desde variables de entorno
    level: env.LOG_LEVEL || "info",

    // 2. FORMATO configurable
    format: winston.format.combine(
      winston.format.timestamp({
        format: env.LOG_TIMESTAMP_FORMAT || "DD-MM-YYYY HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      env.LOG_FORMAT === "json"
        ? winston.format.json()
        : winston.format.simple()
    ),

    // 3. METADATOS por defecto
    defaultMeta: {
      service: env.APP_NAME || "api-service",
      environment: env.NODE_ENV || "development",
    },

    // 4. TRANSPORTS configurables
    transports: [
      // Archivo de errores
      new winston.transports.File({
        filename: env.LOG_ERROR_FILE || "./src/logs/error.log",
        level: "error",
        maxsize: parseInt(env.LOG_MAX_SIZE || "5242880", 10),
        maxFiles: parseInt(env.LOG_MAX_FILES || "5", 10),
      }),

      // Archivo general
      new winston.transports.File({
        filename: env.LOG_COMBINED_FILE || "./src/logs/combined.log",
        level: env.LOG_LEVEL || "info",
        maxsize: parseInt(env.LOG_MAX_SIZE || "5242880", 10),
        maxFiles: parseInt(env.LOG_MAX_FILES || "5", 10),
      }),

      // Consola (condicional)
      ...(env.NODE_ENV !== "production" || env.LOG_CONSOLE === "true"
        ? [
            new winston.transports.Console({
              level: "debug", // En consola siempre muestra más
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                  ({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length
                      ? ` ${JSON.stringify(meta)}`
                      : "";
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                  }
                )
              ),
            }),
          ]
        : []),
    ],

    // 5. MANEJO DE EXCEPCIONES
    exceptionHandlers: [
      new winston.transports.File({
        filename: env.LOG_EXCEPTIONS_FILE || "./src/logs/exceptions.log",
      }),
    ],

    // 6. NO SALIR AL ENCONTRAR ERRORES
    exitOnError: false,
  });
}
