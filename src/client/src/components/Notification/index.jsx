import {
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
  useTheme,
  CircularProgress,
} from "@mui/material";
import NotificationCard from "./NotificationCard";
import NotificationTarget from "./NotificationTarget";
import { useEffect, useState, useCallback, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import useApi from "../../hook/useApi";
import useWebSocket from "../../hook/useWebSocket";

export default function Notification({ userRoles, userID }) {
  const theme = useTheme();
  const axios = useApi();
  const [target, setTarget] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState(null);

  // ✅ REF para controlar si ya nos unimos a las salas
  const hasJoinedRoomsRef = useRef(false);
  // ✅ REF para almacenar el último timestamp de conexión
  const lastConnectionRef = useRef(null);

  // ✅ HOOK de WebSocket
  const {
    connect,
    on,
    off,
    emit,
    getSocket,
    isConnected: wsIsConnected,
  } = useWebSocket();

  // ✅ OBTENER HISTORIAL DE NOTIFICACIONES
  const getNotificationHistory = async () => {
    try {
      const response = await axios.get(`/notifications`);
      
      // 🔥 ACTUALIZAR ÚLTIMA CONEXIÓN
      const now = new Date().toISOString();
      localStorage.setItem("ultima_conexion_notificaciones", now);
      lastConnectionRef.current = now;
      
      return response.data || response;
    } catch (err) {
      console.error("❌ Error cargando historial:", err);
      throw err;
    }
  };

  // ✅ INICIALIZAR ÚLTIMA CONEXIÓN
  useEffect(() => {
    const lastConnection = localStorage.getItem("ultima_conexion_notificaciones");
    if (!lastConnection) {
      const now = new Date().toISOString();
      localStorage.setItem("ultima_conexion_notificaciones", now);
      lastConnectionRef.current = now;
    } else {
      lastConnectionRef.current = lastConnection;
    }
  }, []);

  // ✅ CARGAR HISTORIAL DE NOTIFICACIONES
  useEffect(() => {
    const loadNotificationHistory = async () => {
      if (!userID) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const history = await getNotificationHistory();
        
        // ✅ ORDENAR POR FECHA MÁS RECIENTE PRIMERO
        const sortedHistory = Array.isArray(history) 
          ? history.sort((a, b) => new Date(b.created_at || b.fecha_creacion) - new Date(a.created_at || a.fecha_creacion))
          : [];
          
        setNotifications(sortedHistory);
        setUpdateTrigger(prev => prev + 1);
        setError(null);
      } catch (err) {
        console.error("❌ Error cargando historial:", err);
        setError("Error cargando notificaciones");
      } finally {
        setLoading(false);
      }
    };

    loadNotificationHistory();
  }, [userID]);

  // ✅ MANEJADOR DE NUEVAS NOTIFICACIONES - MEJORADO
  const handleNewNotification = useCallback((data) => {
    console.log("📨 Nueva notificación recibida:", data);
    
    let notificationData = data;

    // Si viene envuelta en data.data, extraerla
    if (data && data.data) {
      notificationData = data.data;
    }

    // Asegurarnos que es un array
    if (!Array.isArray(notificationData)) {
      notificationData = [notificationData];
    }

    // ✅ AGREGAR NUEVAS NOTIFICACIONES AL INICIO Y ELIMINAR DUPLICADOS
    setNotifications(prev => {
      const newNotifications = [...notificationData];
      const existingIds = new Set(prev.map(n => n.id || n._id));
      
      // Filtrar duplicados
      const uniqueNewNotifications = newNotifications.filter(
        notification => !existingIds.has(notification.id || notification._id)
      );

      if (uniqueNewNotifications.length === 0) return prev;

      // Combinar y ordenar por fecha (más recientes primero)
      const combined = [...uniqueNewNotifications, ...prev];
      return combined.sort((a, b) => 
        new Date(b.created_at || b.fecha_creacion) - new Date(a.created_at || a.fecha_creacion)
      );
    });

    setUpdateTrigger(prev => prev + 1);
    
    // ✅ MOSTRAR NOTIFICACIÓN EN SISTEMA SI EL PANEL NO ESTÁ ABIERTO
    if (!target && notificationData[0]?.titulo) {
      // Puedes agregar aquí una notificación toast del sistema
      console.log("🔔 Nueva notificación:", notificationData[0].titulo);
    }
  }, [target]);

  // ✅ MANEJADOR DE NOTIFICACIONES ACTUALIZADAS
  const handleNotificationUpdated = useCallback((data) => {
    console.log("🔄 Notificación actualizada:", data);
    
    const updatedNotification = data.data || data;
    
    setNotifications(prev => 
      prev.map(notification => 
        (notification.id === updatedNotification.id || notification._id === updatedNotification._id) 
          ? { ...notification, ...updatedNotification }
          : notification
      )
    );
    
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // ✅ MANEJADOR DE NOTIFICACIONES ELIMINADAS
  const handleNotificationDeleted = useCallback((data) => {
    console.log("🗑️ Notificación eliminada:", data);
    
    const deletedId = data.id || data._id || data;
    
    setNotifications(prev => 
      prev.filter(notification => 
        notification.id !== deletedId && notification._id !== deletedId
      )
    );
    
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // ✅ MANEJADOR DE CONEXIÓN
  const handleConnect = useCallback(() => {
    console.log("✅ WebSocket conectado para notificaciones");
    setSocketConnected(true);
    setError(null);

    // ✅ UNIRSE A LAS SALAS DE ROLES SOLO UNA VEZ
    if (!hasJoinedRoomsRef.current && userRoles?.length > 0) {
      console.log("🎯 Uniéndose a salas de roles:", userRoles);
      userRoles.forEach((role) => {
        emit("join_role_room", role);
      });
      hasJoinedRoomsRef.current = true;
    }

    // ✅ SOLICITAR NOTIFICACIONES PENDIENTES DESDE LA ÚLTIMA CONEXIÓN
    if (lastConnectionRef.current) {
      emit("get_pending_notifications", { 
        lastConnection: lastConnectionRef.current,
        userId: userID 
      });
    }
  }, [userRoles, emit, userID]);

  // ✅ MANEJADOR DE ERROR DE CONEXIÓN
  const handleConnectError = useCallback((error) => {
    console.error("❌ Error de conexión WebSocket:", error);
    setSocketConnected(false);
    setError(`Error de conexión: ${error.message}`);
    hasJoinedRoomsRef.current = false;
  }, []);

  // ✅ MANEJADOR DE DESCONEXIÓN
  const handleDisconnect = useCallback(() => {
    console.log("🔌 WebSocket desconectado");
    setSocketConnected(false);
    hasJoinedRoomsRef.current = false;
  }, []);

  // ✅ CONFIGURAR WEBSOCKET - VERSIÓN MEJORADA
  useEffect(() => {
    if (!userID) {
      setLoading(false);
      return;
    }

    console.log("🔧 Configurando WebSocket para notificaciones...");

    // 1. REGISTRAR MANEJADORES DE EVENTOS
    on("connect", handleConnect);
    on("disconnect", handleDisconnect);
    on("connect_error", handleConnectError);
    on("new_notification", handleNewNotification);
    on("notification_updated", handleNotificationUpdated);
    on("notification_deleted", handleNotificationDeleted);
    on("pending_notifications", handleNewNotification); // Para notificaciones pendientes

    // 2. VERIFICAR CONEXIÓN ACTUAL
    const socket = getSocket();
    
    if (socket?.connected) {
      console.log("✅ Socket ya conectado, ejecutando handleConnect");
      handleConnect();
      setLoading(false);
    } else {
      // 3. INTENTAR CONEXIÓN
      setLoading(true);
      
      const connectWebSocket = async () => {
        try {
          console.log("🔄 Intentando conectar WebSocket...");
          await connect(userID, userRoles);
          
          // La conexión se manejará en el evento 'connect'
        } catch (err) {
          console.error("💥 Error en connect():", err);
          setError(`Error al conectar: ${err.message}`);
          setLoading(false);
        }
      };

      connectWebSocket();
    }

    // 4. CLEANUP
    return () => {
      console.log("🧹 Limpiando WebSocket...");
      off("connect", handleConnect);
      off("disconnect", handleDisconnect);
      off("connect_error", handleConnectError);
      off("new_notification", handleNewNotification);
      off("notification_updated", handleNotificationUpdated);
      off("notification_deleted", handleNotificationDeleted);
      off("pending_notifications", handleNewNotification);
      hasJoinedRoomsRef.current = false;
    };
  }, [
    userID,
    userRoles,
    connect,
    on,
    off,
    getSocket,
    handleConnect,
    handleDisconnect,
    handleConnectError,
    handleNewNotification,
    handleNotificationUpdated,
    handleNotificationDeleted,
  ]);

  // ✅ MARCAR COMO LEÍDA - MEJORADO
  const markAsRead = async (notificationId) => {
    // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId || notif._id === notificationId
          ? { 
              ...notif, 
              leida: true, 
              fecha_lectura: new Date().toISOString(),
              leida_por: userID
            }
          : notif
      )
    );

    // ✅ ENVIAR AL SERVIDOR
    if (socketConnected) {
      emit("mark_notification_read", { 
        notificationId,
        userId: userID,
        timestamp: new Date().toISOString()
      });
    }

    setUpdateTrigger(prev => prev + 1);
  };

  // ✅ MARCAR TODAS COMO LEÍDAS
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notif => !notif.leida);
    
    if (unreadNotifications.length === 0) return;

    // ✅ ACTUALIZAR ESTADO LOCAL
    setNotifications(prev =>
      prev.map(notif => ({
        ...notif,
        leida: true,
        fecha_lectura: notif.leida ? notif.fecha_lectura : new Date().toISOString(),
        leida_por: notif.leida ? notif.leida_por : userID
      }))
    );

    // ✅ ENVIAR AL SERVIDOR
    if (socketConnected) {
      emit("mark_all_notifications_read", {
        userId: userID,
        timestamp: new Date().toISOString()
      });
    }

    setUpdateTrigger(prev => prev + 1);
  };

  // ✅ CALCULAR ESTADÍSTICAS
  const numNotificationsNoRead = notifications.filter(
    notification => !notification.leida
  ).length;

  // ✅ FILTRAR NOTIFICACIONES
  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.leida;
    if (filter === "read") return notification.leida;
    return notification.tipo_notificacion === filter;
  });

  // ✅ CONTADORES
  const allCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.leida).length;
  const readCount = notifications.filter(n => n.leida).length;

  return (
    <Box>
      <NotificationTarget
        NumNotificationNoRead={numNotificationsNoRead}
        setTarget={setTarget}
        Target={target}
      />

      {/* Panel de notificaciones */}
      {target && (
        <Box
          sx={{
            position: { xs: "fixed", md: "absolute" },
            top: { xs: 0, md: 60 },
            right: { xs: 0, md: 60 },
            bottom: { xs: 0, md: "auto" },
            left: { xs: 0, md: "auto" },
            width: { xs: "100%", md: 450 },
            height: { xs: "100%", md: "auto" },
            maxHeight: { xs: "none", md: 600 },
            backgroundColor: theme.palette.background.paper,
            border: { xs: "none", md: "1px solid" },
            borderColor: theme.palette.divider,
            borderRadius: { xs: 0, md: 2 },
            boxShadow: { xs: theme.shadows[0], md: theme.shadows[8] },
            zIndex: theme.zIndex.modal,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid",
              borderColor: theme.palette.divider,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                Notificaciones
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {unreadCount} sin leer • {allCount} totales
                {socketConnected ? " • ✅ En línea" : " • 🔌 Offline"}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {/* Botón para marcar todas como leídas */}
              {unreadCount > 0 && (
                <Chip
                  label="Marcar todas"
                  size="small"
                  variant="outlined"
                  onClick={markAllAsRead}
                  sx={{ mr: 1 }}
                />
              )}
              
              <IconButton
                onClick={() => setTarget(false)}
                sx={{ display: { xs: "flex", md: "none" } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Filtros */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid",
              borderColor: theme.palette.divider,
            }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Todas (${allCount})`}
                variant={filter === "all" ? "filled" : "outlined"}
                onClick={() => setFilter("all")}
                color="primary"
                size="small"
              />
              <Chip
                label={`No leídas (${unreadCount})`}
                variant={filter === "unread" ? "filled" : "outlined"}
                onClick={() => setFilter("unread")}
                color="error"
                size="small"
              />
              <Chip
                label={`Leídas (${readCount})`}
                variant={filter === "read" ? "filled" : "outlined"}
                onClick={() => setFilter("read")}
                color="success"
                size="small"
              />
            </Stack>
          </Box>

          {/* Lista de notificaciones */}
          <Box
            sx={{
              maxHeight: { xs: "calc(100% - 180px)", md: 400 },
              overflow: "auto",
            }}
          >
            {loading ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Cargando notificaciones...
                </Typography>
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {filter === "all" 
                    ? "No hay notificaciones" 
                    : `No hay notificaciones ${filter === "unread" ? "no leídas" : "leídas"}`
                  }
                </Typography>
              </Box>
            ) : (
              filteredNotifications.map((notification, index) => (
                <NotificationCard
                  key={`${notification.id || notification._id}-${updateTrigger}-${index}`}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </Box>

          {/* Footer con estado de conexión */}
          <Box
            sx={{
              p: 1,
              borderTop: "1px solid",
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.background.default,
              textAlign: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {socketConnected ? "✅ Conectado en tiempo real" : "❌ Sin conexión en tiempo real"}
              {error && ` • ${error}`}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}