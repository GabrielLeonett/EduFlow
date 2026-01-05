import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Room as RoomIcon,
  Group as GroupIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const ModalConflictoClase = ({ 
  open, 
  onClose, 
  conflictos = [], 
  claseData 
}) => {
  const theme = useTheme();

  const getIconoTipoConflicto = (tipo) => {
    switch (tipo) {
      case 'PROFESOR_CONFLICTO_HORARIO':
        return <PersonIcon color="error" />;
      case 'AULA_CONFLICTO':
        return <RoomIcon color="error" />;
      case 'SECCION_CONFLICTO':
        return <GroupIcon color="error" />;
      default:
        return <WarningIcon color="error" />;
    }
  };

  const getColorTipoConflicto = (tipo) => {
    switch (tipo) {
      case 'PROFESOR_CONFLICTO_HORARIO':
        return 'error';
      case 'AULA_CONFLICTO':
        return 'warning';
      case 'SECCION_CONFLICTO':
        return 'info';
      default:
        return 'error';
    }
  };

  const getTituloTipoConflicto = (tipo) => {
    switch (tipo) {
      case 'PROFESOR_CONFLICTO_HORARIO':
        return 'Conflicto de Profesor';
      case 'AULA_CONFLICTO':
        return 'Aula Ocupada';
      case 'SECCION_CONFLICTO':
        return 'Conflicto de Sección';
      default:
        return 'Conflicto';
    }
  };

  const formatearHora = (horaString) => {
    if (!horaString) return '';
    const hora = horaString.split(':');
    return `${hora[0]}:${hora[1]}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[10]
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.error.light,
          color: theme.palette.error.contrastText,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <WarningIcon />
        <Typography variant="h6" component="div" fontWeight="bold">
          Conflictos de Horario Detectados
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Información de la clase que se intentó mover/crear */}
        {claseData && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              m: 2, 
              backgroundColor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Clase que intentó asignar:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip 
                size="small"
                label={claseData.nombre_unidad_curricular || 'Sin nombre'}
                color="info"
                variant="outlined"
              />
              <Chip 
                size="small"
                label={`Prof: ${claseData.nombre_profesor} ${claseData.apellido_profesor}`}
                variant="outlined"
              />
              <Chip 
                size="small"
                label={`Aula: ${claseData.codigo_aula}`}
                variant="outlined"
              />
              <Chip 
                size="small"
                label={`Día: ${claseData.dia_semana}`}
                variant="outlined"
              />
              <Chip 
                size="small"
                label={`Hora: ${formatearHora(claseData.hora_inicio)} - ${formatearHora(claseData.hora_fin)}`}
                variant="outlined"
              />
            </Box>
          </Paper>
        )}

        {/* Alert de resumen */}
        <Alert 
          severity="warning" 
          sx={{ 
            mx: 2, 
            mt: 1,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2" fontWeight="medium">
              Se encontraron {conflictos.length} conflicto(s) que impiden asignar esta clase:
            </Typography>
          </Box>
        </Alert>

        {/* Lista de conflictos */}
        <List sx={{ py: 0 }}>
          {conflictos.map((conflicto, index) => (
            <React.Fragment key={index}>
              <ListItem 
                alignItems="flex-start"
                sx={{
                  py: 2,
                  px: 3,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.02)
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  {getIconoTipoConflicto(conflicto.tipo_conflicto)}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip 
                        label={getTituloTipoConflicto(conflicto.tipo_conflicto)}
                        color={getColorTipoConflicto(conflicto.tipo_conflicto)}
                        size="small"
                        variant="filled"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {conflicto.recurso}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography 
                        variant="body2" 
                        color="text.primary" 
                        paragraph
                        sx={{ mb: 1.5 }}
                      >
                        {conflicto.mensaje}
                      </Typography>

                      {/* Información del horario en conflicto */}
                      {conflicto.horario_conflicto && (
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1.5, 
                            backgroundColor: alpha(theme.palette.grey[500], 0.05),
                            borderColor: alpha(theme.palette.grey[500], 0.2)
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Horario existente:
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {conflicto.horario_conflicto.unidad_curricular && (
                              <Chip 
                                size="small"
                                label={conflicto.horario_conflicto.unidad_curricular}
                                variant="outlined"
                              />
                            )}
                            {conflicto.horario_conflicto.profesor && (
                              <Chip 
                                size="small"
                                label={`Prof: ${conflicto.horario_conflicto.profesor}`}
                                variant="outlined"
                              />
                            )}
                            {conflicto.horario_conflicto.aula && (
                              <Chip 
                                size="small"
                                label={`Aula: ${conflicto.horario_conflicto.aula}`}
                                variant="outlined"
                              />
                            )}
                            {conflicto.horario_conflicto.seccion && (
                              <Chip 
                                size="small"
                                label={`Sección: ${conflicto.horario_conflicto.seccion}`}
                                variant="outlined"
                              />
                            )}
                            <Chip 
                              size="small"
                              icon={<ScheduleIcon sx={{ fontSize: '14px !important' }} />}
                              label={`${formatearHora(conflicto.horario_conflicto.hora_inicio)} - ${formatearHora(conflicto.horario_conflicto.hora_fin)}`}
                              variant="outlined"
                            />
                          </Box>
                        </Paper>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              
              {index < conflictos.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          startIcon={<CloseIcon />}
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalConflictoClase;