import { Server } from "socket.io";
import { server } from "../backend-server.js";
import { socketAuth } from "../middlewares/auth.js";
import { joinRoleRooms } from "../middlewares/process.js";
import config from "../config/index.js"; // Importar configuración

export default class SocketServices {
  static instance;

  constructor(protocol = "websocket") {
    if (SocketServices.instance) {
      return SocketServices.instance;
    }

    this.protocolSocket = protocol;
    this.io = null;
    SocketServices.instance = this;
  }

  initializeService(socketOptions = null) {
    if (this.io) {
      return this.io;
    }

    // Obtener configuración de socket
    const socketConfig = config.server.socket;
    
    // Usar opciones personalizadas si se proporcionan, o las de configuración
    const options = socketOptions || {
      cors: {
        origin: socketConfig.options.cors.origin || ["http://localhost:5173"],
        methods: socketConfig.options.cors.methods || ["GET", "POST"],
        credentials: socketConfig.options.cors.credentials !== false,
      },
      transports: socketConfig.options.transports || [this.protocolSocket],
      allowEIO3: socketConfig.options.allowEIO3,
      pingTimeout: socketConfig.options.pingTimeout || 60000,
      pingInterval: socketConfig.options.pingInterval || 25000,
      connectTimeout: socketConfig.options.connectTimeout || 45000,
      allowUpgrades: socketConfig.options.allowUpgrades !== false,
      perMessageDeflate: socketConfig.options.perMessageDeflate !== false,
      httpCompression: socketConfig.options.httpCompression !== false,
      maxHttpBufferSize: socketConfig.limits.maxHttpBufferSize || 1e6,
      maxConnections: socketConfig.limits.maxConnections || 1000,
      maxPayload: socketConfig.limits.maxPayload || 1e6,
    };

    // Log de configuración (solo en desarrollo)
    if (config.server.server.isDevelopment) {
      console.log("⚙️ Configuración de Socket.IO cargada:");
      console.log(`   - Orígenes CORS: ${options.cors.origin}`);
      console.log(`   - Transports: ${options.transports}`);
      console.log(`   - Timeout: ${options.pingTimeout}ms`);
      console.log(`   - Conexiones máx: ${options.maxConnections}`);
    }

    this.io = new Server(server, options);

    // Aplicar middleware solo si la autenticación está habilitada
    if (socketConfig.auth.enabled !== false) {
      this.io.use(socketAuth(socketConfig.auth));
    }
    
    // 🔥 Middleware para unir a salas automáticamente
    this.io.use((socket, next) => {
      joinRoleRooms(socket, next, socketConfig.rooms);
    });

    // Configurar manejadores de eventos del servidor socket.io
    this.setupSocketEventHandlers();

    return this.io;
  }

  setupSocketEventHandlers() {
    if (!this.io) return;

    // Handler para conexiones
    this.io.on("connection", (socket) => {
      const socketConfig = config.server.socket;
      
      console.log(`🔌 Socket conectado: ${socket.id}`);
      
      // Unir a sala broadcast si está configurada
      if (socketConfig.rooms.broadcastRoom) {
        socket.join(socketConfig.rooms.broadcastRoom);
      }

      // Handler para desconexión
      socket.on("disconnect", (reason) => {
        console.log(`🔌 Socket desconectado: ${socket.id} - ${reason}`);
      });

      // Handler para errores
      socket.on("error", (error) => {
        console.error(`❌ Error en socket ${socket.id}:`, error);
      });
    });

    // Handler para errores del servidor socket.io
    this.io.on("error", (error) => {
      console.error("❌ Error en servidor Socket.IO:", error);
    });
  }

  // Métodos utilitarios para emitir eventos
  emitToUser(userId, event, data) {
    if (!this.io) return;
    const roomName = `${config.server.socket.rooms.userPrefix}${userId}`;
    this.io.to(roomName).emit(event, data);
  }

  emitToRole(role, event, data) {
    if (!this.io) return;
    const roomName = `${config.server.socket.rooms.rolePrefix}${role}`;
    this.io.to(roomName).emit(event, data);
  }

  emitToAll(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  emitToRoom(roomName, event, data) {
    if (!this.io) return;
    this.io.to(roomName).emit(event, data);
  }

  // Método para obtener estadísticas
  getSocketStats() {
    if (!this.io) return null;
    
    const sockets = this.io.sockets.sockets;
    const connectedSockets = Array.from(sockets.values());
    
    return {
      totalConnections: connectedSockets.length,
      connectedUsers: connectedSockets.map(s => s.user?.id).filter(Boolean),
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
      activeSockets: connectedSockets.map(socket => ({
        id: socket.id,
        userId: socket.user?.id,
        roles: socket.user?.roles || [],
        rooms: Array.from(socket.rooms),
        connectedAt: socket.handshake.issued,
      })),
    };
  }

  // Método para desconectar usuarios específicos
  disconnectUser(userId) {
    if (!this.io) return;
    
    const sockets = this.io.sockets.sockets;
    const userSockets = Array.from(sockets.values()).filter(
      socket => socket.user?.id === userId
    );
    
    userSockets.forEach(socket => {
      socket.disconnect(true);
      console.log(`🔌 Socket desconectado forzosamente para usuario: ${userId}`);
    });
    
    return userSockets.length;
  }

  static getInstance() {
    if (!SocketServices.instance) {
      SocketServices.instance = new SocketServices();
    }
    return SocketServices.instance;
  }
}