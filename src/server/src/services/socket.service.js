import { Server } from "socket.io";
import { server } from "../server.js";
import { socketAuth } from "../middlewares/auth.js";
import { joinRoleRooms } from "../middlewares/process.js";

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

  initializeService() {
    if (this.io) {
      return this.io;
    }

    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:5173", "https://miapp.com"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: [this.protocolSocket],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Aplicar middleware simplificado
    this.io.use(socketAuth());
    // 🔥 Middleware para unir a salas automáticamente
    this.io.use(joinRoleRooms);

    return this.io;
  }

  static getInstance() {
    if (!SocketServices.instance) {
      SocketServices.instance = new SocketServices();
    }
    return SocketServices.instance;
  }
}
