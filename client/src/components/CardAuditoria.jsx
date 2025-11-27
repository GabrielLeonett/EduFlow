import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Avatar,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Person,
  Schedule,
  Computer,
  ExpandMore,
  ExpandLess,
  Info,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AuditoriaCard = ({ evento }) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Determinar icono y color según el tipo de evento
  const getEventoConfig = () => {
    switch (evento.estado_evento) {
      case 'error':
        return { icon: <ErrorIcon />, color: 'error' };
      case 'éxito':
        return { icon: <CheckCircle />, color: 'success' };
      default:
        return { icon: <Info />, color: 'info' };
    }
  };

  const getCategoriaColor = (categoria) => {
    const colores = {
      'Autenticación': 'primary',
      'Creación': 'success',
      'Actualización': 'warning',
      'Eliminación': 'error',
      'Consulta': 'info',
      'Error': 'error',
      'Otro': 'default'
    };
    return colores[categoria] || 'default';
  };

  const eventoConfig = getEventoConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          mb: 2,
          border: `1px solid`,
          borderColor: expanded ? 'primary.main' : 'divider',
          boxShadow: expanded ? 3 : 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 4,
            borderColor: 'primary.light',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header de la card */}
          <Box display="flex" alignItems="flex-start" gap={2}>
            {/* Avatar del usuario */}
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 50,
                height: 50,
              }}
            >
              {evento.usuario_nombres?.[0]}{evento.usuario_apellidos?.[0]}
            </Avatar>

            {/* Información principal */}
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {eventoConfig.icon}
                <Typography variant="h6" fontWeight="600">
                  {evento.usuario_nombres} {evento.usuario_apellidos}
                </Typography>
                <Chip
                  label={evento.categoria_evento}
                  color={getCategoriaColor(evento.categoria_evento)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={evento.estado_evento}
                  color={eventoConfig.color}
                  size="small"
                />
              </Box>

              <Typography variant="body1" color="text.primary" gutterBottom>
                {evento.mensaje}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Tooltip title="Entidad afectada">
                  <Chip
                    icon={<Computer />}
                    label={evento.entidad_afectada}
                    variant="outlined"
                    size="small"
                  />
                </Tooltip>

                <Tooltip title="Acción realizada">
                  <Chip
                    label={evento.accion_especifica}
                    variant="filled"
                    size="small"
                    color="secondary"
                  />
                </Tooltip>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(evento.fecha_evento).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Botón expandir */}
            <IconButton
              onClick={handleExpandClick}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <ExpandMore />
            </IconButton>
          </Box>

          {/* Contenido expandible */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2 }} />
            
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3}>
              
              {/* Información del usuario */}
              <Box>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom color="primary">
                  📋 Información del Usuario
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Cédula:</Typography>
                    <Typography variant="caption" fontWeight="600">{evento.usuario_cedula}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Email:</Typography>
                    <Typography variant="caption" fontWeight="600">{evento.usuario_email}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Género:</Typography>
                    <Typography variant="caption" fontWeight="600">{evento.usuario_genero}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Estado:</Typography>
                    <Chip
                      label={evento.usuario_activo ? 'Activo' : 'Inactivo'}
                      color={evento.usuario_activo ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Detalles del evento */}
              <Box>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom color="primary">
                  🔍 Detalles del Evento
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {evento.registro_afectado_id && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Registro ID:</Typography>
                      <Typography variant="caption" fontWeight="600">{evento.registro_afectado_id}</Typography>
                    </Box>
                  )}
                  {evento.referencia_id && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Referencia:</Typography>
                      <Typography variant="caption" fontWeight="600">{evento.referencia_id}</Typography>
                    </Box>
                  )}
                  {evento.direccion_ip && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">IP:</Typography>
                      <Typography variant="caption" fontWeight="600">{evento.direccion_ip}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Log ID:</Typography>
                    <Typography variant="caption" fontWeight="600">#{evento.log_id}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Metadatos */}
              {evento.metadatos && Object.keys(evento.metadatos).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom color="primary">
                    📊 Metadatos
                  </Typography>
                  <Box 
                    sx={{ 
                      maxHeight: 120, 
                      overflow: 'auto',
                      backgroundColor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                      {JSON.stringify(evento.metadatos, null, 2)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Detalles adicionales */}
              {evento.detalles_adicionales && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom color="primary">
                    📝 Detalles Adicionales
                  </Typography>
                  <Typography variant="caption" color="text.primary">
                    {evento.detalles_adicionales}
                  </Typography>
                </Box>
              )}

            </Box>

            {/* User Agent */}
            {evento.agente_usuario && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  <strong>User Agent:</strong> {evento.agente_usuario}
                </Typography>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuditoriaCard;