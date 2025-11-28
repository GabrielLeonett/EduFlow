import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
  Avatar,
  Stack,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  AccessTime,
  LocationOn,
  Code,
  Group,
  MeetingRoom,
  Schedule,
} from "@mui/icons-material";
import CustomButton from "./customButton";
import CustomChip from "./CustomChip";
import { useNavigate } from "react-router-dom";

export default function CardAula({ aula, onGestionarAula }) {
  const navigate = useNavigate();

  // Función para obtener el color de la sede
  const getSedeColor = (idSede) => {
    const colors = {
      1: "primary",
      2: "secondary",
      3: "success",
      4: "warning",
      5: "error"
    };
    return colors[idSede] || "default";
  };

  // Función para obtener iniciales del código del aula
  const getInitials = (codigo) => {
    if (!codigo) return "A";
    return codigo.substring(0, 2).toUpperCase();
  };

  // Función para determinar el estado del aula
  const getEstadoAula = () => {
    // Aquí puedes agregar lógica basada en horarios, disponibilidad, etc.
    return {
      label: "Disponible",
      color: "success"
    };
  };

  const estadoAula = getEstadoAula();

  return (
    <Card
      elevation={2}
      sx={{
        width: "100%" ,
        height: "auto", // Altura fija para consistencia
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
        },
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => onGestionarAula && onGestionarAula(aula)}
    >
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header con avatar y información principal */}
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 56,
              height: 56,
              fontSize: "1.2rem",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getInitials(aula.codigo_aula)}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Tooltip title={aula.codigo_aula} arrow>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                noWrap
                sx={{ mb: 0.5 }}
              >
                {aula.codigo_aula}
              </Typography>
            </Tooltip>
            <Tooltip title={aula.nombre_sede} arrow>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                noWrap
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <LocationOn sx={{ fontSize: 16 }} />
                {aula.nombre_sede}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              <Code sx={{ fontSize: 12, mr: 0.5 }} />
              ID: {aula.id_aula}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Información detallada del aula */}
        <Box sx={{ mb: 2, flex: 1 }}>
          <Stack spacing={2}>
            {/* Código del aula */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Code sx={{ fontSize: 18 }} />
                Código:
              </Typography>
              <CustomChip
                label={aula.codigo_aula}
                color="primary"
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {/* Sede */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOn sx={{ fontSize: 18 }} />
                Núcleo:
              </Typography>
              <Tooltip title={aula.nombre_sede} arrow>
                <CustomChip
                  label={aula.nombre_sede}
                  color={getSedeColor(aula.id_sede)}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    maxWidth: 120,
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }
                  }}
                />
              </Tooltip>
            </Box>

            {/* Estado */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MeetingRoom sx={{ fontSize: 18 }} />
                Estado:
              </Typography>
              <CustomChip
                label={estadoAula.label}
                color={estadoAula.color}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Información adicional */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <Group sx={{ fontSize: 18 }} />
            Especificaciones
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Tooltip title={`Capacidad: ${aula.capacidad_aula || 0} personas`} arrow>
              <CustomChip
                icon={<Group sx={{ fontSize: 16 }} />}
                label={`${aula.capacidad_aula || 0}`}
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ fontSize: "0.75rem", fontWeight: 500 }}
              />
            </Tooltip>
            {aula.tipo_aula && (
              <Tooltip title={`Tipo: ${aula.tipo_aula}`} arrow>
                <CustomChip
                  label={aula.tipo_aula}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.75rem", fontWeight: 500 }}
                />
              </Tooltip>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Botón de acción */}
        <CustomButton
          variant="contained"
          fullWidth
          startIcon={<AccessTime />}
          onClick={(e) => {
            e.stopPropagation(); // Prevenir que se active el click de la card
            navigate(`/horarios/aulas/${aula.id_aula}`);
          }}
          sx={{
            minHeight: 42,
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Ver Horario
        </CustomButton>
      </CardContent>
    </Card>
  );
}