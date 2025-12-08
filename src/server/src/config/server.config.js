/**
 * Configuración completa del servidor Express
 * @param {Object} env - Variables de entorno
 * @returns {Object} Configuración completa del servidor
 */
export default function serverConfig(env) {
  // Determinar entorno
  const isProduction = env.NODE_ENV === "production";
  const isDevelopment = env.NODE_ENV === "development";
  const isTesting = env.NODE_ENV === "test";

  return {
    // ========== CONFIGURACIÓN BÁSICA DEL SERVIDOR ==========
    server: {
      port: parseInt(env.PORT) || 3001,
      host: env.HOST || (isProduction ? "0.0.0.0" : "localhost"),
      protocol: env.PROTOCOL || (isProduction ? "https" : "http"),
      
      // URLs
      baseUrl: env.BASE_URL || `http://localhost:${parseInt(env.PORT) || 3001}`,
      apiPrefix: env.API_PREFIX || "",
      
      // Entorno
      environment: env.NODE_ENV || "development",
      isProduction,
      isDevelopment,
      isTesting,
      
      // Información
      appName: env.APP_NAME || "UPTAMCA Server",
      appVersion: env.APP_VERSION || "1.0.0",
    },


    // ========== CONFIGURACIÓN DE SOCKET.IO ==========
    socket: {
      enabled: env.SOCKET_ENABLED !== "false",
      
      // Opciones de Socket.io
      options: {
        cors: {
          origin: env.SOCKET_CORS_ORIGIN || "*",
          methods: ["GET", "POST"],
          credentials: env.SOCKET_CORS_CREDENTIALS === "true",
        },
        transports: (env.SOCKET_TRANSPORTS || "polling,websocket").split(","),
        allowEIO3: env.SOCKET_ALLOW_EIO3 === "true",
        
        // Timeouts y ping
        pingTimeout: parseInt(env.SOCKET_PING_TIMEOUT) || 5000,
        pingInterval: parseInt(env.SOCKET_PING_INTERVAL) || 25000,
        connectTimeout: parseInt(env.SOCKET_CONNECT_TIMEOUT) || 45000,
        
        // Comportamiento
        allowUpgrades: env.SOCKET_ALLOW_UPGRADES !== "false",
        perMessageDeflate: env.SOCKET_COMPRESSION === "true",
        httpCompression: env.SOCKET_HTTP_COMPRESSION === "true",
      },

      // Autenticación
      auth: {
        enabled: env.SOCKET_AUTH_ENABLED !== "false",
        timeout: parseInt(env.SOCKET_AUTH_TIMEOUT) || 5000,
        required: env.SOCKET_AUTH_REQUIRED === "true",
      },

      // Salas y namespaces
      rooms: {
        userPrefix: env.SOCKET_USER_ROOM_PREFIX || "user_",
        rolePrefix: env.SOCKET_ROLE_ROOM_PREFIX || "role_",
        adminRoom: env.SOCKET_ADMIN_ROOM || "role_SuperAdmin",
        broadcastRoom: env.SOCKET_BROADCAST_ROOM || "broadcast",
      },

      // Límites
      limits: {
        maxHttpBufferSize: parseInt(env.SOCKET_MAX_BUFFER_SIZE) || 1e6,
        maxConnections: parseInt(env.SOCKET_MAX_CONNECTIONS) || 1000,
        maxPayload: parseInt(env.SOCKET_MAX_PAYLOAD) || 1e6,
      },
    },

  };
}