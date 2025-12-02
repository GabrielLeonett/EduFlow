import { Box, Typography, Chip, IconButton, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Launch,
  Schedule,
  Assignment,
  Grade,
  Message,
} from "@mui/icons-material";
import { useEffect } from "react";

export default function NotificationCard({ notification, onMarkAsRead }) {
  const navigate = useNavigate();
  const theme = useTheme();

  // Iconos por tipo de notificación
  const getNotificationIcon = (type) => {
    const icons = {
      sistema: <Assignment sx={{ color: theme.palette.error.main }} />,
      curso: <Launch sx={{ color: theme.palette.primary.main }} />,
      horario: <Schedule sx={{ color: theme.palette.warning.main }} />,
      calificacion: <Grade sx={{ color: theme.palette.success.main }} />,
      mensaje: <Message sx={{ color: theme.palette.secondary.main }} />,
      recordatorio: <Schedule sx={{ color: theme.palette.error.dark }} />,
    };
    return icons[type] || <Assignment />;
  };

  // Colores por prioridad usando el theme
  const getPriorityColor = (priority) => {
    const colors = {
      baja: theme.palette.grey[500],
      normal: theme.palette.info.main,
      media: theme.palette.warning.main,
      alta: theme.palette.error.main,
      urgente: theme.palette.error.dark,
    };
    return colors[priority] || theme.palette.grey[500];
  };

  // Manejar clic en la notificación
  const handleNotificationClick = () => {
    // ✅ Marcar como leída al hacer clic
    if (!notification.leida && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    if (notification.metadatos.url_action) {
      navigate(notification.metadatos.url_action);
    } else {
      navigate("/");
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hoy";
    } else if (diffDays === 1) {
      return "Ayer";
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        border: `1px solid ${
          notification.leida
            ? theme.palette.divider
            : theme.palette.primary.main
        }`,
        backgroundColor: notification.leida
          ? theme.palette.background.paper
          : theme.palette.action.hover,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: notification.leida
            ? theme.palette.action.hover
            : theme.palette.action.selected,
          transform: "translateY(-1px)",
          boxShadow: theme.shadows[2],
        },
      }}
      onClick={handleNotificationClick}
    >
      {/* Header de la notificación */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getNotificationIcon(notification.tipo_notificacion)}
          <Typography
            variant="h6"
            sx={{
              fontWeight: notification.leida ? "normal" : "bold",
              color: notification.leida
                ? theme.palette.text.primary
                : theme.palette.primary.main,
              fontSize: theme.typography.body1.fontSize,
            }}
          >
            {notification.titulo}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {/* Indicador de no leído */}
          {!notification.leida && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.main,
              }}
            />
          )}

          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            {formatDate(notification.fecha_creacion)}
          </Typography>
        </Box>
      </Box>

      {/* Cuerpo de la notificación */}
      <Typography
        variant="body2"
        sx={{
          mb: 2,
          color: theme.palette.text.primary,
          lineHeight: 1.5,
        }}
      >
        {notification.contenido}
      </Typography>

      {/* Metadata y etiquetas */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {/* Chip de tipo */}
        <Chip
          label={notification.tipo_notificacion}
          size="small"
          variant="outlined"
          sx={{
            textTransform: "capitalize",
            borderColor: theme.palette.divider,
          }}
        />

        {/* Chip de prioridad */}
        {notification.prioridad && (
          <Chip
            label={notification.prioridad}
            size="small"
            sx={{
              backgroundColor: getPriorityColor(notification.prioridad),
              color: theme.palette.common.white,
              fontWeight: "bold",
              textTransform: "capitalize",
            }}
          />
        )}

        {/* Indicador de notificación masiva */}
        {notification.es_masiva && (
          <Chip
            label="Masiva"
            size="small"
            variant="outlined"
            sx={{
              borderColor: theme.palette.info.main,
              color: theme.palette.info.main,
            }}
          />
        )}

        {/* Información de destinatarios */}
        {notification.total_destinatarios && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            {notification.total_destinatarios} destinatarios
          </Typography>
        )}

        {/* Fecha de mantenimiento si existe */}
        {notification.metadatos?.maintenance_date && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.warning.main,
              fontWeight: "bold",
            }}
          >
            {formatDate(notification.metadatos.maintenance_date)}
          </Typography>
        )}
      </Box>

      {/* Acciones rápidas */}
      <Box
        sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "space-between" }}
      >
        {/* Botón para marcar como leída/no leída */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            if (onMarkAsRead) {
              onMarkAsRead(notification.id);
            }
          }}
          sx={{
            border: "1px solid",
            borderColor: notification.leida
              ? theme.palette.success.main
              : theme.palette.divider,
            borderRadius: 1,
            color: notification.leida
              ? theme.palette.success.main
              : theme.palette.text.secondary,
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <Launch fontSize="small" />
        </IconButton>

        {/* Estado de lectura */}
        <Typography
          variant="caption"
          sx={{
            color: notification.leida
              ? theme.palette.success.main
              : theme.palette.warning.main,
            fontWeight: "bold",
            alignSelf: "center",
          }}
        >
          {notification.leida ? "Leída" : "No leída"}
        </Typography>
      </Box>
    </Box>
  );
}
