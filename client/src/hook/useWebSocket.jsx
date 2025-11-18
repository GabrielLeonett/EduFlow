import { useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import env from "../config/env";

// 🔥 INSTANCIA SINGLETON GLOBAL REAL - UNA SOLA CONEXIÓN
let webSocketSingletonInstance = null;

class WebSocketSingleton {
  constructor() {
    if (webSocketSingletonInstance) {
      return webSocketSingletonInstance;
    }

    this.socket = null;
    this.connectionPromise = null;
    this.isConnecting = false;
    this.eventListeners = new Map();
    this.currentUser = null; // ✅ SOLO UN USUARIO ACTIVO
    this.componentSubscribers = new Set(); // ✅ RASTREAR COMPONENTES QUE USAN LA CONEXIÓN

    webSocketSingletonInstance = this;
  }

  connect(userID, userRoles) {
    // ✅ Reutilizar si ya está conectada para el mismo usuario
    if (this.socket?.connected && this.currentUser === userID) {
      this.componentSubscribers.add("component");
      return Promise.resolve(this.socket);
    }

    // ✅ Si ya hay una promesa en curso, devolver la misma
    if (this.isConnecting && this.connectionPromise) {
      this.componentSubscribers.add("component");
      return this.connectionPromise;
    }

    // ✅ Marcar inicio de conexión inmediatamente
    this.isConnecting = true;
    this.connectingUser = userID;

    // 🔥 Crear promesa antes de intentar conectar
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Si hay un socket previo con usuario distinto, cerrarlo
        if (this.socket && this.currentUser !== userID) {
          this.socket.disconnect();
          this.socket = null;
        }

        const newSocket = io(env.serverUrl, {
          transports: ["websocket"],
          withCredentials: true,
          auth: { user_id: userID, roles: userRoles },
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        // En tu hook useWebSocket - AGREGAR esto en el evento connect
        newSocket.once("connect", () => {
          this.socket = newSocket;
          this.currentUser = userID;
          this.isConnecting = false;
          this.connectingUser = null;
          this.componentSubscribers.add("main");

          // ✅ UNIRSE A SALAS DE ROLES
          if (userRoles?.length > 0) {
            userRoles.forEach((role) => {
              newSocket.emit("join_role_room", role);
            });
          }

          // ✅ NUEVO: UNIRSE A SALA PERSONAL (IMPORTANTE)
          newSocket.emit("join_user_room", {
            userId: userID,
            roles: userRoles,
          });

          console.log(
            `🎯 Usuario ${userID} unido a sala personal: user_${userID}`
          );

          resolve(newSocket);
        });

        newSocket.once("connect_error", (error) => {
          console.error(`❌ Error conectando usuario ${userID}:`, error);
          this.isConnecting = false;
          this.currentUser = null;
          this.connectionPromise = null;
          this.connectingUser = null;
          this.componentSubscribers.clear();
          reject(error);
        });

        newSocket.once("disconnect", () => {
          this.currentUser = null;
          this.isConnecting = false;
          this.connectionPromise = null;
          this.connectingUser = null;
          this.componentSubscribers.clear();
        });
      } catch (error) {
        console.error(`💥 Error inesperado:`, error);
        this.isConnecting = false;
        this.currentUser = null;
        this.connectionPromise = null;
        this.connectingUser = null;
        this.componentSubscribers.clear();
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // ✅ DESCONECTAR SOLO SI NO HAY MÁS COMPONENTES USANDO LA CONEXIÓN
  disconnect(componentId = "component") {
    // ✅ REMOVER ESTE COMPONENTE DE LOS SUSCRIPTORES
    this.componentSubscribers.delete(componentId);

    // ✅ SOLO DESCONECTAR SI NO QUEDAN COMPONENTES USANDO LA CONEXIÓN
    if (this.componentSubscribers.size === 0 && this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUser = null;
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // ✅ NUEVO: VERIFICAR SI HAY CONEXIÓN ACTIVA
  hasActiveConnection() {
    return this.socket?.connected && this.currentUser !== null;
  }

  // ✅ NUEVO: OBTENER USUARIO ACTUAL
  getCurrentUser() {
    return this.currentUser;
  }
}

// 🔥 INSTANCIA GLOBAL ÚNICA
const webSocketSingleton = new WebSocketSingleton();

// 🔥 HOOK MEJORADO - UNA SOLA CONEXIÓN COMPARTIDA
export default function useWebSocket() {
  const socketRef = useRef(webSocketSingleton);
  const componentIdRef = useRef(
    `component_${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    if (!localStorage.getItem("ultima_conexion_notificaciones")) {
      localStorage.setItem(
        "ultima_conexion_notificaciones",
        new Date().toISOString()
      );
    }

    // ✅ CLEANUP: REMOVER ESTE COMPONENTE AL DESMONTAJE
    return () => {
      socketRef.current.disconnect(componentIdRef.current);
    };
  }, []);

  // ✅ CONNECT - COMPARTIR LA MISMA CONEXIÓN
  const connect = useCallback((userID, userRoles) => {
    return socketRef.current.connect(userID, userRoles);
  }, []);

  // ✅ DISCONNECT - SOLO REMOVER ESTE COMPONENTE
  const disconnect = useCallback(() => {
    return socketRef.current.disconnect(componentIdRef.current);
  }, []);

  const on = useCallback((event, callback) => {
    return socketRef.current.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    return socketRef.current.off(event, callback);
  }, []);

  const emit = useCallback((event, data) => {
    return socketRef.current.emit(event, data);
  }, []);

  const getSocket = useCallback(() => {
    return socketRef.current.getSocket();
  }, []);

  const isConnected = useCallback(() => {
    return socketRef.current.isConnected();
  }, []);

  // ✅ NUEVOS MÉTODOS PARA DEBUG
  const getCurrentUser = useCallback(() => {
    return socketRef.current.getCurrentUser();
  }, []);

  const hasActiveConnection = useCallback(() => {
    return socketRef.current.hasActiveConnection();
  }, []);

  return {
    connect,
    disconnect,
    on,
    off,
    emit,
    getSocket,
    isConnected,
    getCurrentUser, // ✅ PARA DEBUG
    hasActiveConnection, // ✅ PARA DEBUG
    instance: socketRef.current,
  };
}

// 🔥 EXPORTAR PARA DEBUG
export { webSocketSingleton };
